// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CollateralNFT
 * @notice Token hóa tài sản thế chấp từ file ảnh với IPFS storage
 * @dev Mỗi tài sản có hash duy nhất, chống duplicate và double-collateral
 */
contract CollateralNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // Asset types
    enum AssetType {
        MACHINERY,           // Máy móc thiết bị
        INVENTORY,           // Hàng tồn kho
        REAL_ESTATE,         // Bất động sản
        VEHICLE,             // Phương tiện
        INVOICE,             // Hóa đơn
        RECEIVABLE,          // Khoản phải thu
        OTHER                // Khác
    }

    // Collateral metadata
    struct Collateral {
        string assetName;           // Tên tài sản
        AssetType assetType;        // Loại tài sản
        uint256 estimatedValue;     // Giá trị ước tính (USDC, 6 decimals)
        string description;         // Mô tả chi tiết
        string imageIPFSHash;       // IPFS CID của ảnh
        bytes32 fileHash;           // SHA-256 hash của file gốc (để verify integrity)
        uint256 uploadTimestamp;    // Thời điểm upload
        bool isLocked;              // Trạng thái khóa (đang thế chấp)
        address lockedBy;           // Contract đã lock (StreamCredit address)
        uint256 lockedAt;           // Thời điểm lock
        uint256 loanAmount;         // Số tiền đang vay (nếu locked)
    }

    // Mappings
    mapping(uint256 => Collateral) public collaterals;
    mapping(bytes32 => bool) public fileHashExists;          // Check duplicate file
    mapping(bytes32 => uint256) public fileHashToTokenId;    // File hash → Token ID
    mapping(address => bool) public authorizedContracts;     // Authorized lenders

    // Events
    event CollateralMinted(
        uint256 indexed tokenId,
        address indexed owner,
        AssetType assetType,
        uint256 estimatedValue,
        bytes32 fileHash,
        string imageIPFSHash
    );
    
    event CollateralLocked(
        uint256 indexed tokenId,
        address indexed lockedBy,
        uint256 loanAmount,
        uint256 lockedAt
    );
    
    event CollateralUnlocked(
        uint256 indexed tokenId,
        address indexed unlockedBy,
        uint256 unlockedAt
    );

    event CollateralValueUpdated(
        uint256 indexed tokenId,
        uint256 oldValue,
        uint256 newValue
    );

    constructor() ERC721("Collateral NFT", "COLL") Ownable(msg.sender) {}

    /**
     * @notice Authorize lending contract to lock/unlock collateral
     */
    function authorizeContract(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
    }

    /**
     * @notice Mint collateral NFT từ uploaded asset
     * @param to Owner của tài sản
     * @param assetName Tên tài sản
     * @param assetType Loại tài sản (enum)
     * @param estimatedValue Giá trị ước tính (USDC)
     * @param description Mô tả chi tiết
     * @param imageIPFSHash IPFS CID của ảnh
     * @param fileHash SHA-256 hash của file gốc
     * @param metadataURI URI của metadata JSON (trên IPFS)
     */
    /**
     * @notice Mint collateral NFT
     * @dev Anyone can mint NFT for themselves
     */
    function mintCollateral(
        address to,
        string memory assetName,
        AssetType assetType,
        uint256 estimatedValue,
        string memory description,
        string memory imageIPFSHash,
        bytes32 fileHash,
        string memory metadataURI
    ) external returns (uint256) {
        require(to == msg.sender, "Can only mint to yourself");
        require(estimatedValue > 0, "Value must be > 0");
        require(!fileHashExists[fileHash], "Asset already tokenized (duplicate file)");
        require(bytes(imageIPFSHash).length > 0, "IPFS hash required");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        collaterals[tokenId] = Collateral({
            assetName: assetName,
            assetType: assetType,
            estimatedValue: estimatedValue,
            description: description,
            imageIPFSHash: imageIPFSHash,
            fileHash: fileHash,
            uploadTimestamp: block.timestamp,
            isLocked: false,
            lockedBy: address(0),
            lockedAt: 0,
            loanAmount: 0
        });

        fileHashExists[fileHash] = true;
        fileHashToTokenId[fileHash] = tokenId;

        emit CollateralMinted(tokenId, to, assetType, estimatedValue, fileHash, imageIPFSHash);

        return tokenId;
    }

    /**
     * @notice Lock collateral khi dùng làm thế chấp
     * @param tokenId ID của NFT
     * @param loanAmount Số tiền vay
     */
    function lockCollateral(uint256 tokenId, uint256 loanAmount) external {
        require(authorizedContracts[msg.sender], "Not authorized to lock");
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!collaterals[tokenId].isLocked, "Collateral already locked");

        collaterals[tokenId].isLocked = true;
        collaterals[tokenId].lockedBy = msg.sender;
        collaterals[tokenId].lockedAt = block.timestamp;
        collaterals[tokenId].loanAmount = loanAmount;

        emit CollateralLocked(tokenId, msg.sender, loanAmount, block.timestamp);
    }

    /**
     * @notice Unlock collateral sau khi trả nợ xong
     */
    function unlockCollateral(uint256 tokenId) external {
        require(collaterals[tokenId].isLocked, "Collateral not locked");
        require(collaterals[tokenId].lockedBy == msg.sender, "Only locker can unlock");

        collaterals[tokenId].isLocked = false;
        collaterals[tokenId].lockedBy = address(0);
        collaterals[tokenId].lockedAt = 0;
        collaterals[tokenId].loanAmount = 0;

        emit CollateralUnlocked(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @notice Update giá trị tài sản (chỉ owner NFT)
     * @dev Cho phép cập nhật khi thị trường thay đổi
     */
    function updateCollateralValue(uint256 tokenId, uint256 newValue) external {
        require(_ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!collaterals[tokenId].isLocked, "Cannot update locked collateral");
        require(newValue > 0, "Value must be > 0");

        uint256 oldValue = collaterals[tokenId].estimatedValue;
        collaterals[tokenId].estimatedValue = newValue;

        emit CollateralValueUpdated(tokenId, oldValue, newValue);
    }

    /**
     * @notice Check collateral có đang bị lock không (PUBLIC - ai cũng verify được)
     */
    function isCollateralLocked(uint256 tokenId) external view returns (bool) {
        return collaterals[tokenId].isLocked;
    }

    /**
     * @notice Check file hash đã được tokenized chưa
     */
    function isFileTokenized(bytes32 fileHash) external view returns (bool) {
        return fileHashExists[fileHash];
    }

    /**
     * @notice Get full collateral data
     */
    function getCollateralData(uint256 tokenId) external view returns (Collateral memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return collaterals[tokenId];
    }

    /**
     * @notice Get tokenId by file hash
     */
    function getTokenIdByFileHash(bytes32 fileHash) external view returns (uint256) {
        require(fileHashExists[fileHash], "File not tokenized");
        return fileHashToTokenId[fileHash];
    }

    /**
     * @notice Get all tokenIds owned by address
     */
    function getOwnedTokenIds(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 counter = 0;

        uint256 totalSupply = _tokenIdCounter;
        for (uint256 i = 0; i < totalSupply; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[counter] = i;
                counter++;
            }
        }

        return tokenIds;
    }

    /**
     * @notice Verify file integrity bằng cách compare hash
     * @param tokenId Token ID
     * @param providedHash Hash của file để verify
     * @return true nếu hash khớp
     */
    function verifyFileIntegrity(uint256 tokenId, bytes32 providedHash) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return collaterals[tokenId].fileHash == providedHash;
    }

    /**
     * @notice Get collateral utilization info (cho lenders)
     * @param tokenId Token ID của collateral
     * @return isUsed True nếu đang bị lock
     * @return lender Địa chỉ contract đang lock (hoặc address(0))
     * @return loanAmount Số tiền vay hiện tại (USDC, 6 decimals)
     * @return estimatedValue Giá trị ước tính của collateral (USDC, 6 decimals)
     * @return ltvRatio Loan-to-Value ratio (basis points, VD: 7000 = 70%)
     */
    function getCollateralUtilization(uint256 tokenId) external view returns (
        bool isUsed,
        address lender,
        uint256 loanAmount,
        uint256 estimatedValue,
        uint256 ltvRatio
    ) {
        Collateral memory coll = collaterals[tokenId];
        isUsed = coll.isLocked;
        lender = coll.lockedBy;
        loanAmount = coll.loanAmount;
        estimatedValue = coll.estimatedValue;
        
        if (isUsed && estimatedValue > 0) {
            ltvRatio = (loanAmount * 10000) / estimatedValue;
        } else {
            ltvRatio = 0;
        }
    }

    /**
     * @notice Override transfer để prevent transfer khi locked
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        require(!collaterals[tokenId].isLocked, "Cannot transfer locked collateral");
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Required overrides
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
