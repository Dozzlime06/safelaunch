// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./SafeLaunchToken.sol";

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function mint(MintParams calldata params) external payable returns (
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}

contract SafeLaunchFactory is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    
    address public constant FEE_WALLET = 0xa2eB6bE3bDe7e99a8E68E6252E006cEd620ff02f;
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public constant SALE_SUPPLY = 800_000_000 * 1e18;
    uint256 public constant LIQUIDITY_SUPPLY = 200_000_000 * 1e18;

    struct Token {
        address tokenAddress;
        address creator;
        string metadataURI;
        uint256 totalRaised;
        uint256 totalRefunded;
        uint256 tokensSold;
        uint256 deadline;
        uint256 failedTimestamp;
        bool bonded;
        bool failed;
    }

    uint256 public launchFee;
    uint256 public tradeFeePercent;
    uint256 public bondingTarget;
    uint256 public emergencyGracePeriod;
    uint256 public maxBuyPerWallet;
    
    uint256 public tokenCount;
    mapping(uint256 => Token) public tokens;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => uint256)) public tokenBalances;
    mapping(uint256 => uint256) public lpPositionIds;  // NFT position ID per token
    
    address public positionManager;  // Uniswap V3 NonfungiblePositionManager
    address public weth;             // WETH address on Base

    event TokenCreated(
        uint256 indexed tokenId, 
        address indexed tokenAddress, 
        address indexed creator, 
        string metadataURI,
        uint256 deadline
    );
    event Buy(
        uint256 indexed tokenId, 
        address indexed buyer, 
        uint256 ethAmount, 
        uint256 tokenAmount,
        uint256 totalRaised
    );
    event Bonded(
        uint256 indexed tokenId, 
        address lpAddress, 
        uint256 lpAmount,
        uint256 liquidityETH
    );
    event Failed(uint256 indexed tokenId, uint256 totalRaised);
    event Refund(uint256 indexed tokenId, address indexed user, uint256 amount);
    event EmergencyWithdraw(uint256 indexed tokenId, uint256 amount);
    event LPWithdrawn(uint256 indexed tokenId, uint256 amount);
    event FeePaid(uint256 indexed tokenId, string feeType, uint256 amount);

    function initialize(address _positionManager, address _weth) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        launchFee = 0.001 ether;
        tradeFeePercent = 100;
        bondingTarget = 8.5 ether;
        emergencyGracePeriod = 180 days;
        maxBuyPerWallet = 0.5 ether;
        positionManager = _positionManager;
        weth = _weth;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata metadataURI,
        uint256 durationHours
    ) external payable whenNotPaused returns (uint256) {
        require(msg.value >= launchFee, "Insufficient launch fee");
        require(durationHours >= 12 && durationHours <= 72, "Invalid duration: 12-72 hours");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        require(bytes(symbol).length > 0 && bytes(symbol).length <= 10, "Invalid symbol length");

        SafeLaunchToken token = new SafeLaunchToken(name, symbol, metadataURI, address(this));

        tokenCount++;
        tokens[tokenCount] = Token({
            tokenAddress: address(token),
            creator: msg.sender,
            metadataURI: metadataURI,
            totalRaised: 0,
            totalRefunded: 0,
            tokensSold: 0,
            deadline: block.timestamp + (durationHours * 1 hours),
            failedTimestamp: 0,
            bonded: false,
            failed: false
        });

        (bool feeSuccess, ) = FEE_WALLET.call{value: launchFee}("");
        require(feeSuccess, "Fee transfer failed");
        emit FeePaid(tokenCount, "launch", launchFee);

        uint256 remainingETH = msg.value - launchFee;
        
        // Optional initial buy - if extra ETH sent beyond launch fee
        if (remainingETH > 0) {
            _processInitialBuy(tokenCount, remainingETH);
        }

        emit TokenCreated(tokenCount, address(token), msg.sender, metadataURI, tokens[tokenCount].deadline);
        return tokenCount;
    }

    function _processInitialBuy(uint256 tokenId, uint256 ethAmount) internal {
        Token storage token = tokens[tokenId];
        
        require(
            contributions[tokenId][msg.sender] + ethAmount <= maxBuyPerWallet,
            "Exceeds max buy per wallet"
        );

        uint256 fee = (ethAmount * tradeFeePercent) / 10000;
        uint256 netAmount = ethAmount - fee;

        uint256 tokenAmount = _getTokensForETH(tokenId, netAmount);
        require(token.tokensSold + tokenAmount <= SALE_SUPPLY, "Exceeds sale supply");

        token.totalRaised += netAmount;
        token.tokensSold += tokenAmount;
        contributions[tokenId][msg.sender] += netAmount;
        tokenBalances[tokenId][msg.sender] += tokenAmount;

        (bool feeSuccess, ) = FEE_WALLET.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        emit FeePaid(tokenId, "trade", fee);

        emit Buy(tokenId, msg.sender, ethAmount, tokenAmount, token.totalRaised);
    }

    function buy(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Token storage token = tokens[tokenId];
        require(token.tokenAddress != address(0), "Token does not exist");
        require(!token.bonded && !token.failed, "Sale ended");
        require(block.timestamp < token.deadline, "Deadline passed");
        require(msg.value > 0, "No ETH sent");
        require(
            contributions[tokenId][msg.sender] + msg.value <= maxBuyPerWallet,
            "Exceeds max buy per wallet"
        );

        uint256 fee = (msg.value * tradeFeePercent) / 10000;
        uint256 netAmount = msg.value - fee;

        uint256 tokenAmount = _getTokensForETH(tokenId, netAmount);
        require(token.tokensSold + tokenAmount <= SALE_SUPPLY, "Exceeds sale supply");

        token.totalRaised += netAmount;
        token.tokensSold += tokenAmount;
        contributions[tokenId][msg.sender] += netAmount;
        tokenBalances[tokenId][msg.sender] += tokenAmount;

        (bool feeSuccess, ) = FEE_WALLET.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        emit FeePaid(tokenId, "trade", fee);

        emit Buy(tokenId, msg.sender, msg.value, tokenAmount, token.totalRaised);

        if (token.totalRaised >= bondingTarget) {
            _bondToUniswap(tokenId);
        }
    }

    function _getTokensForETH(uint256 tokenId, uint256 ethAmount) internal view returns (uint256) {
        Token storage token = tokens[tokenId];
        
        // Linear bonding curve: price increases as more tokens are sold
        // Starting MC: $5K, Ending MC: $30K (6x growth)
        // Formula: price = basePrice + (slope * tokensSold)
        
        uint256 basePrice = bondingTarget * 1e18 / (SALE_SUPPLY * 6); // Starting price ($5K MC)
        uint256 endPrice = bondingTarget * 1e18 / SALE_SUPPLY;        // End price ($30K MC)
        uint256 slope = (endPrice - basePrice) * 1e18 / SALE_SUPPLY;
        
        // Current price based on tokens already sold
        uint256 currentPrice = basePrice + (slope * token.tokensSold / 1e18);
        
        // Calculate tokens for this ETH amount at current price
        // Using average price for this purchase
        uint256 avgPrice = currentPrice + (slope * ethAmount / (2 * currentPrice));
        
        return (ethAmount * 1e18) / avgPrice;
    }

    function _bondToUniswap(uint256 tokenId) internal {
        Token storage token = tokens[tokenId];
        token.bonded = true;

        // Wrap ETH to WETH
        IWETH(weth).deposit{value: token.totalRaised}();
        
        // Approve tokens
        IERC20(token.tokenAddress).approve(positionManager, LIQUIDITY_SUPPLY);
        IWETH(weth).approve(positionManager, token.totalRaised);
        
        // Sort tokens (required for Uniswap V3)
        (address token0, address token1) = token.tokenAddress < weth 
            ? (token.tokenAddress, weth) 
            : (weth, token.tokenAddress);
        
        (uint256 amount0, uint256 amount1) = token.tokenAddress < weth
            ? (LIQUIDITY_SUPPLY, token.totalRaised)
            : (token.totalRaised, LIQUIDITY_SUPPLY);
        
        // Calculate initial price (sqrtPriceX96)
        // Price = totalRaised / LIQUIDITY_SUPPLY (in token terms)
        uint160 sqrtPriceX96 = _calculateSqrtPriceX96(token.totalRaised, LIQUIDITY_SUPPLY, token.tokenAddress < weth);
        
        // Create pool and initialize
        INonfungiblePositionManager pm = INonfungiblePositionManager(positionManager);
        address pool = pm.createAndInitializePoolIfNecessary(
            token0,
            token1,
            10000,  // 1% fee tier (good for meme tokens)
            sqrtPriceX96
        );
        
        // Mint full-range liquidity position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: 10000,
            tickLower: -887200,  // Full range (aligned to tick spacing 200)
            tickUpper: 887200,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: 0,
            amount1Min: 0,
            recipient: address(this),
            deadline: block.timestamp + 300
        });
        
        (uint256 positionId, uint128 liquidity,,) = pm.mint(params);
        
        // Store NFT position ID
        lpPositionIds[tokenId] = positionId;

        emit Bonded(tokenId, pool, liquidity, token.totalRaised);
    }
    
    function _calculateSqrtPriceX96(
        uint256 ethAmount,
        uint256 tokenAmount,
        bool tokenIsToken0
    ) internal pure returns (uint160) {
        // sqrtPriceX96 = sqrt(price) * 2^96
        // price = token1/token0
        uint256 price;
        if (tokenIsToken0) {
            // token is token0, WETH is token1
            // price = WETH/token = ethAmount/tokenAmount
            price = (ethAmount * 1e18) / tokenAmount;
        } else {
            // WETH is token0, token is token1
            // price = token/WETH = tokenAmount/ethAmount
            price = (tokenAmount * 1e18) / ethAmount;
        }
        
        // sqrt(price) * 2^96
        uint256 sqrtPrice = sqrt(price * 1e18);
        return uint160((sqrtPrice << 96) / 1e18);
    }
    
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function claimTokens(uint256 tokenId) external nonReentrant {
        Token storage token = tokens[tokenId];
        require(token.bonded, "Not bonded yet");
        
        uint256 amount = tokenBalances[tokenId][msg.sender];
        require(amount > 0, "No tokens to claim");

        tokenBalances[tokenId][msg.sender] = 0;
        
        IERC20(token.tokenAddress).transfer(msg.sender, amount);
    }

    function checkFailed(uint256 tokenId) external {
        Token storage token = tokens[tokenId];
        require(token.tokenAddress != address(0), "Token does not exist");
        require(!token.bonded && !token.failed, "Already ended");
        require(block.timestamp > token.deadline, "Not expired yet");

        token.failed = true;
        token.failedTimestamp = block.timestamp;
        emit Failed(tokenId, token.totalRaised);
    }

    function claimRefund(uint256 tokenId) external nonReentrant {
        Token storage token = tokens[tokenId];
        require(token.failed, "Not failed");
        
        uint256 amount = contributions[tokenId][msg.sender];
        require(amount > 0, "Nothing to refund");

        contributions[tokenId][msg.sender] = 0;
        tokenBalances[tokenId][msg.sender] = 0;
        token.totalRefunded += amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Refund(tokenId, msg.sender, amount);
    }

    function emergencyWithdraw(uint256 tokenId) external onlyOwner {
        Token storage token = tokens[tokenId];
        require(token.failed, "Not failed");
        require(
            block.timestamp > token.failedTimestamp + emergencyGracePeriod,
            "Grace period not over (180 days)"
        );

        uint256 unclaimed = token.totalRaised - token.totalRefunded;
        require(unclaimed > 0, "Nothing to withdraw");

        token.totalRefunded = token.totalRaised;

        // Emergency withdraw goes to owner (deployer), NOT fee wallet
        (bool success, ) = owner().call{value: unclaimed}("");
        require(success, "Transfer failed");

        emit EmergencyWithdraw(tokenId, unclaimed);
    }

    function withdrawLP(uint256 tokenId) external onlyOwner {
        uint256 positionId = lpPositionIds[tokenId];
        require(positionId > 0, "No LP position");
        
        lpPositionIds[tokenId] = 0;
        
        // Transfer NFT position to owner (deployer)
        IERC721(positionManager).transferFrom(address(this), owner(), positionId);
        
        emit LPWithdrawn(tokenId, positionId);
    }

    function setFees(uint256 _launchFee, uint256 _tradeFeePercent) external onlyOwner {
        require(_tradeFeePercent <= 500, "Max 5% trade fee");
        launchFee = _launchFee;
        tradeFeePercent = _tradeFeePercent;
    }

    function setBondingTarget(uint256 _target) external onlyOwner {
        bondingTarget = _target;
    }

    function setMaxBuyPerWallet(uint256 _maxBuy) external onlyOwner {
        maxBuyPerWallet = _maxBuy;
    }

    function setPositionManager(address _positionManager) external onlyOwner {
        require(_positionManager != address(0), "Invalid position manager");
        positionManager = _positionManager;
    }

    function setWETH(address _weth) external onlyOwner {
        require(_weth != address(0), "Invalid WETH");
        weth = _weth;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getToken(uint256 tokenId) external view returns (Token memory) {
        return tokens[tokenId];
    }

    function getContribution(uint256 tokenId, address user) external view returns (uint256) {
        return contributions[tokenId][user];
    }

    function getTokenBalance(uint256 tokenId, address user) external view returns (uint256) {
        return tokenBalances[tokenId][user];
    }

    function getCurrentPrice(uint256 tokenId) external view returns (uint256) {
        Token storage token = tokens[tokenId];
        
        // Linear bonding curve price
        uint256 basePrice = bondingTarget * 1e18 / (SALE_SUPPLY * 6); // $5K MC start
        uint256 endPrice = bondingTarget * 1e18 / SALE_SUPPLY;        // $30K MC end
        uint256 slope = (endPrice - basePrice) * 1e18 / SALE_SUPPLY;
        
        return basePrice + (slope * token.tokensSold / 1e18);
    }

    function getTokensForETH(uint256 tokenId, uint256 ethAmount) external view returns (uint256) {
        uint256 fee = (ethAmount * tradeFeePercent) / 10000;
        return _getTokensForETH(tokenId, ethAmount - fee);
    }

    function getRemainingSupply(uint256 tokenId) external view returns (uint256) {
        return SALE_SUPPLY - tokens[tokenId].tokensSold;
    }

    // Owner-only withdraw - can withdraw anytime, marks token as failed
    function ownerWithdraw(uint256 tokenId) external onlyOwner {
        Token storage token = tokens[tokenId];
        require(token.tokenAddress != address(0), "Token does not exist");
        require(!token.bonded, "Already bonded to DEX");
        
        uint256 amount = token.totalRaised - token.totalRefunded;
        require(amount > 0, "Nothing to withdraw");
        
        token.totalRefunded = token.totalRaised;
        token.failed = true;
        token.failedTimestamp = block.timestamp;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdraw(tokenId, amount);
    }
    
    // Owner can withdraw entire contract balance (emergency)
    function ownerWithdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
