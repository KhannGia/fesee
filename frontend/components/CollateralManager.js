/**
 * CollateralManager Component - Protocol Console Style
 * Upload asset images, calculate hash, store on IPFS, and mint Collateral NFT
 * Dark theme with blue-purple-cyan gradients
 */

'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { calculateFileHash, uploadToIPFS, getIPFSGatewayURL, verifyFileIntegrity } from '../utils/ipfsUpload';
import { createCollateral, useCollateralHistory } from '../hooks/useCollateralHistory';
import { CONTRACTS } from '../config/constants';

// Asset types matching smart contract enum
const ASSET_TYPES = [
  { value: 0, label: 'Máy móc thiết bị', icon: '⚙️', color: 'from-blue-500 to-cyan-500' },
  { value: 1, label: 'Hàng tồn kho', icon: '📦', color: 'from-purple-500 to-pink-500' },
  { value: 2, label: 'Bất động sản', icon: '🏢', color: 'from-green-500 to-emerald-500' },
  { value: 3, label: 'Phương tiện', icon: '🚗', color: 'from-yellow-500 to-orange-500' },
  { value: 4, label: 'Hóa đơn', icon: '📄', color: 'from-indigo-500 to-blue-500' },
  { value: 5, label: 'Khoản phải thu', icon: '💰', color: 'from-cyan-500 to-teal-500' },
  { value: 6, label: 'Khác', icon: '📋', color: 'from-gray-500 to-slate-500' }
];

// Workflow steps
const STEPS = [
  { id: 1, label: 'Chọn dữ liệu', icon: '📁', key: 'upload' },
  { id: 2, label: 'Tạo Hash', icon: '🔐', key: 'hash' },
  { id: 3, label: 'IPFS Upload', icon: '☁️', key: 'ipfs' },
  { id: 4, label: 'On-Chain', icon: '⚡', key: 'mint' }
];

export default function CollateralManager() {
  const { account, mintCollateral, collateralNFT } = useWeb3();
  
  // Form state
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState(0);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Upload state
  const [fileHash, setFileHash] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [ipfsData, setIpfsData] = useState(null);
  
  // NFT state
  const [userCollaterals, setUserCollaterals] = useState([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  
  /**
   * Handle file selection
   */
  const handleFileSelect = async (e) => {
    console.log('File select triggered', e);
    console.log('Files:', e.target.files);
    
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 10MB for free IPFS)
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB');
      return;
    }
    
    setSelectedFile(file);
    setCurrentStep(1);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Calculate file hash
    try {
      setCurrentStep(2);
      setUploadStatus('Đang tính toán hash của file...');
      const hash = await calculateFileHash(file);
      setFileHash(hash);
      setUploadStatus('Hash tạo thành công');
      
      // Check if file already tokenized
      if (collateralNFT) {
        const exists = await collateralNFT.isFileTokenized(hash);
        if (exists) {
          const tokenId = await collateralNFT.fileHashToTokenId(hash);
          setUploadStatus(`⚠️ File đã được token hóa (Token #${tokenId.toString()})`);
        }
      }
    } catch (error) {
      console.error('Hash calculation failed:', error);
      setUploadStatus('Lỗi: ' + error.message);
    }
  };
  
  /**
   * Upload to IPFS and mint NFT using Web3Context
   */
  const handleMintCollateral = async () => {
    if (!selectedFile || !assetName || !estimatedValue) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    if (!fileHash) {
      alert('Đang tính hash... Vui lòng đợi');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(20);
      
      // Step 3: Upload to IPFS
      setCurrentStep(3);
      setUploadStatus('Đang upload lên IPFS...');
      const metadata = {
        assetName,
        assetType,
        estimatedValue,
        description,
        fileHash
      };
      
      const ipfsResult = await uploadToIPFS(selectedFile, metadata);
      setIpfsData(ipfsResult);
      setUploadProgress(50);
      setUploadStatus('Upload IPFS thành công!');
      
      console.log('📦 IPFS Result:', ipfsResult);
      console.log('🔧 mintCollateral function:', mintCollateral);
      
      // Step 4: Mint NFT on blockchain via Web3Context
      setCurrentStep(4);
      setUploadStatus('Đang mint NFT on-chain...');
      
      if (!mintCollateral) {
        throw new Error('mintCollateral function not available. Please connect wallet.');
      }
      
      console.log('🚀 Calling mintCollateral with params:', {
        assetName,
        assetType,
        estimatedValue,
        imageCID: ipfsResult.imageCID,
        fileHash,
        metadataURI: ipfsResult.metadataURI
      });
      
      const result = await mintCollateral(
        assetName,
        assetType,
        estimatedValue,
        description,
        ipfsResult.imageCID,
        fileHash,
        ipfsResult.metadataURI,
        selectedFile.name,
        selectedFile.size,
        selectedFile.type
      );
      
      console.log('✅ Mint result:', result);
      
      setUploadProgress(100);
      setUploadStatus(`✅ Mint thành công! Token ID: ${result.tokenId}`);
      
      // Wait for database to sync, then refetch and reset
      setTimeout(() => {
        console.log('🔄 Triggering refetch...');
        refetch?.(); // Force reload from database
        resetForm();
      }, 2500); // Increase timeout to ensure database has saved
      
    } catch (error) {
      console.error('❌ Mint failed:', error);
      console.error('Error stack:', error.stack);
      setUploadStatus('❌ Lỗi: ' + error.message);
      setIsUploading(false); // Clear loading state on error
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Reset form
   */
  const resetForm = () => {
    setAssetName('');
    setAssetType(0);
    setEstimatedValue('');
    setDescription('');
    setSelectedFile(null);
    setImagePreview(null);
    setFileHash('');
    setUploadStatus('');
    setUploadProgress(0);
    setCurrentStep(1);
    setIpfsData(null);
    setIsUploading(false); // Clear uploading state
  };
  
  /**
   * Load user's collateral NFTs from database (faster than blockchain)
   */
  const { collaterals: dbCollaterals, loading: dbLoading, refetch } = useCollateralHistory(account);
  
  // Sync dbCollaterals to local state whenever it changes
  useEffect(() => {
    if (dbCollaterals) {
      const nfts = dbCollaterals.map(col => ({
        tokenId: col.tokenId,
        assetName: col.assetName,
        assetType: col.assetTypeLabel,
        estimatedValue: (Number(col.estimatedValue) / 1e6).toFixed(2),
        description: col.description,
        imageIPFSHash: col.imageIPFSHash,
        imageURL: col.imageURL || getIPFSGatewayURL(col.imageIPFSHash),
        isLocked: col.isLocked,
        lockedBy: col.lockedBy || '',
        loanAmount: col.loanAmount ? (Number(col.loanAmount) / 1e6).toFixed(2) : 0,
        ltvRatio: col.ltvRatio || 0,
        uploadTimestamp: new Date(col.mintedAt).toLocaleDateString('vi-VN')
      }));
      setUserCollaterals(nfts);
    } else if (dbCollaterals !== undefined) {
      // dbCollaterals is explicitly empty array
      setUserCollaterals([]);
    }
  }, [dbCollaterals]);
  
  // Sync loading state from hook
  useEffect(() => {
    setIsLoadingNFTs(dbLoading);
  }, [dbLoading]);
  
  const loadUserCollaterals = () => {
    // This function now just triggers refetch
    if (refetch) {
      refetch();
    }
  };
  
  /**
   * Update collateral value
   */
  const handleUpdateValue = async (tokenId, newValue) => {
    try {
      const valueInUSDC = Math.floor(parseFloat(newValue) * 1e6);
      const tx = await collateralNFT.updateCollateralValue(tokenId, valueInUSDC);
      await tx.wait();
      alert('✅ Cập nhật giá trị thành công!');
      refetch(); // Use refetch instead of loadUserCollaterals
    } catch (error) {
      alert('❌ Lỗi: ' + error.message);
    }
  };
  
  // No longer need this useEffect - data auto-syncs via dbCollaterals effect above
  // useEffect(() => {
  //   loadUserCollaterals();
  // }, [account]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              🏦 Quản lý Tài sản Thế chấp
            </h1>
            <p className="text-slate-400">Token hóa tài sản → Tạo ZK Proof → Nhận Credit On-Chain</p>
          </div>
          {account && (
            <div className="px-4 py-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-300">Connected</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Steps */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${currentStep >= step.id ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 transition-all ${
                      currentStep > step.id 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50' 
                        : currentStep === step.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50 animate-pulse'
                        : 'bg-slate-700'
                    }`}>
                      {currentStep > step.id ? '✓' : step.icon}
                    </div>
                    <span className="text-xs text-slate-400">{step.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-20 h-1 mx-2 mt-[-20px] ${currentStep > step.id ? 'bg-gradient-to-r from-green-500 to-cyan-500' : 'bg-slate-700'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Form Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📤</span>
              Token hóa Tài sản Mới
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tên tài sản</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-slate-500"
                  placeholder="VD: Máy CNC XYZ-2000"
                />
              </div>
              
              {/* Asset Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Loại tài sản</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white"
                >
                  {ASSET_TYPES.map(type => (
                    <option key={type.value} value={type.value} className="bg-slate-800">
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Estimated Value */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Giá trị ước tính (USDC)</label>
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-slate-500"
                  placeholder="VD: 50000"
                />
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ảnh tài sản</label>
                
                {/* Custom File Button */}
                <div className="relative">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-2 border-dashed border-cyan-500/50 rounded-lg hover:border-cyan-400 transition-all text-center">
                    <span className="text-cyan-400">
                      {selectedFile ? selectedFile.name : '📎 Click để chọn file ảnh'}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-1">Max 10MB • JPG, PNG, GIF, WebP</p>
              </div>
              
              {/* Description - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-slate-500"
                  rows={3}
                  placeholder="Thông tin chi tiết về tài sản..."
                />
              </div>
            </div>

            {/* File Hash Display */}
            {fileHash && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">🔐 File Hash (SHA-256)</p>
                <p className="text-sm font-mono text-cyan-400 break-all">{fileHash}</p>
              </div>
            )}

            {/* IPFS Data */}
            {ipfsData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">☁️ IPFS Storage</p>
                <p className="text-xs font-mono text-green-400 mb-1">Image: {ipfsData.imageCID}</p>
                <p className="text-xs font-mono text-green-400">Metadata: {ipfsData.metadataCID}</p>
              </div>
            )}

            {/* Status & Progress */}
            {uploadStatus && (
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-300 mb-2">{uploadStatus}</p>
                {isUploading && (
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 shadow-lg shadow-cyan-500/50"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleMintCollateral}
                disabled={!selectedFile || isUploading || !account}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:scale-105 disabled:transform-none"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  '🚀 Mint Collateral NFT'
                )}
              </button>
              
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview & Info */}
        <div className="space-y-6">
          
          {/* Image Preview */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Preview</h3>
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-slate-600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4 opacity-20">🖼️</div>
                <p className="text-slate-500">Chưa có ảnh</p>
              </div>
            )}
          </div>

          {/* Asset Info */}
          {assetName && (
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">{ASSET_TYPES[assetType].icon}</span>
                Thông tin Tài sản
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Tên</p>
                  <p className="text-sm font-semibold text-white">{assetName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Loại</p>
                  <p className="text-sm text-cyan-400">{ASSET_TYPES[assetType].label}</p>
                </div>
                {estimatedValue && (
                  <div>
                    <p className="text-xs text-slate-400">Giá trị ước tính</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      ${parseFloat(estimatedValue).toLocaleString()} USDC
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NFT List */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Danh sách Tài sản của bạn
            </h3>
            <button
              onClick={loadUserCollaterals}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-all"
            >
              🔄 Refresh
            </button>
          </div>
          
          {isLoadingNFTs ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
          ) : userCollaterals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-20">📦</div>
              <p className="text-slate-400">Chưa có tài sản nào được token hóa</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCollaterals.map((nft) => (
                <div
                  key={nft.tokenId}
                  onClick={() => setSelectedNFT(nft)}
                  className={`relative group cursor-pointer bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border rounded-xl overflow-hidden transition-all transform hover:scale-105 hover:shadow-2xl ${
                    nft.isLocked 
                      ? 'border-red-500/50 hover:shadow-red-500/50' 
                      : 'border-green-500/50 hover:shadow-green-500/50'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {nft.isLocked ? (
                      <div className="px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LOCKED
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        AVAILABLE
                      </div>
                    )}
                  </div>

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={nft.imageURL}
                      alt={nft.assetName}
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23334155" width="400" height="300"/><text fill="%23CBD5E1" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>'; 
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                    
                    {/* Token ID Badge */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                      <p className="text-xs text-cyan-400 font-mono">#{nft.tokenId}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-lg text-white truncate">{nft.assetName}</h4>
                      <p className="text-sm text-slate-400">{nft.assetType}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Giá trị</p>
                        <p className="text-lg font-bold text-green-400">${nft.estimatedValue}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Ngày tạo</p>
                        <p className="text-xs text-slate-300">{nft.uploadTimestamp}</p>
                      </div>
                    </div>

                    {nft.isLocked ? (
                      <div className="p-3 bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-red-400 mb-1">🔒 Đang thế chấp</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">Khoản vay</p>
                            <p className="text-red-300 font-mono">${nft.loanAmount}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">LTV</p>
                            <p className="text-red-300 font-mono">{nft.ltvRatio}%</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-green-400 mb-2">✅ Sẵn sàng sử dụng</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newValue = prompt('Nhập giá trị mới (USDC):', nft.estimatedValue);
                            if (newValue) handleUpdateValue(nft.tokenId, newValue);
                          }}
                          className="w-full px-3 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg text-xs text-green-300 transition-all"
                        >
                          Cập nhật giá trị
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                    nft.isLocked 
                      ? 'bg-gradient-to-br from-red-500/10 to-transparent' 
                      : 'bg-gradient-to-br from-green-500/10 to-transparent'
                  }`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedNFT(null)}
        >
          <div 
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold">Chi tiết NFT #{selectedNFT.tokenId}</h3>
              <button
                onClick={() => setSelectedNFT(null)}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Image */}
              <img
                src={selectedNFT.imageURL}
                alt={selectedNFT.assetName}
                className="w-full h-96 object-cover rounded-xl border-2 border-slate-600"
                onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="%23334155" width="800" height="600"/><text fill="%23CBD5E1" font-size="48" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>'; }}
              />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Tên tài sản</p>
                  <p className="text-lg font-semibold text-white">{selectedNFT.assetName}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Loại</p>
                  <p className="text-lg font-semibold text-cyan-400">{selectedNFT.assetType}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Giá trị ước tính</p>
                  <p className="text-2xl font-bold text-green-400">${selectedNFT.estimatedValue}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Ngày tạo</p>
                  <p className="text-lg text-slate-300">{selectedNFT.uploadTimestamp}</p>
                </div>
              </div>

              {/* Description */}
              {selectedNFT.description && (
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Mô tả</p>
                  <p className="text-slate-300">{selectedNFT.description}</p>
                </div>
              )}

              {/* Status */}
              <div className={`p-4 rounded-lg ${
                selectedNFT.isLocked 
                  ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/30' 
                  : 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30'
              }`}>
                <p className="text-lg font-semibold mb-3">
                  {selectedNFT.isLocked ? '🔒 Trạng thái: Đang thế chấp' : '✅ Trạng thái: Sẵn sàng'}
                </p>
                {selectedNFT.isLocked && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Khoản vay</p>
                      <p className="text-red-300 font-mono text-lg">${selectedNFT.loanAmount} USDC</p>
                    </div>
                    <div>
                      <p className="text-slate-400">LTV Ratio</p>
                      <p className="text-red-300 font-mono text-lg">{selectedNFT.ltvRatio}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* IPFS Link */}
              <a
                href={selectedNFT.imageURL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-center font-semibold transition-all"
              >
                🌐 Xem trên IPFS Gateway
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
