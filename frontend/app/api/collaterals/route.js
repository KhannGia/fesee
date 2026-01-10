import dbConnect from '../../../lib/mongodb';
import Collateral from '../../../models/Collateral';
import { NextResponse } from 'next/server';

// GET - Lấy danh sách collateral NFTs của một wallet
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const isLocked = searchParams.get('isLocked'); // filter by lock status
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    const query = { walletAddress: walletAddress.toLowerCase() };
    if (isLocked !== null && isLocked !== undefined) {
      query.isLocked = isLocked === 'true';
    }
    
    const collaterals = await Collateral.find(query)
      .sort({ mintedAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Collateral.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: collaterals,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit
      }
    });
  } catch (error) {
    console.error('Error fetching collaterals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaterals', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Tạo collateral record mới khi mint NFT
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      walletAddress,
      tokenId,
      contractAddress,
      assetName,
      assetType,
      assetTypeLabel,
      estimatedValue,
      description,
      imageIPFSHash,
      imageURL,
      metadataURI,
      fileHash,
      mintTxHash,
      network = 'sepolia',
      originalFilename,
      fileSize,
      mimeType
    } = body;
    
    // Validate required fields
    if (!walletAddress || !tokenId || !contractAddress || !assetName || 
        estimatedValue === undefined || !imageIPFSHash || !fileHash || !mintTxHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if tokenId already exists
    const existing = await Collateral.findOne({ tokenId, contractAddress: contractAddress.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: 'Collateral NFT already exists in database' },
        { status: 409 }
      );
    }
    
    // Create new collateral record
    const collateral = await Collateral.create({
      walletAddress: walletAddress.toLowerCase(),
      tokenId,
      contractAddress: contractAddress.toLowerCase(),
      assetName,
      assetType,
      assetTypeLabel,
      estimatedValue,
      description,
      imageIPFSHash,
      imageURL,
      metadataURI,
      fileHash,
      mintTxHash,
      network,
      mintedAt: new Date(),
      originalFilename,
      fileSize,
      mimeType
    });
    
    return NextResponse.json({
      success: true,
      data: collateral
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating collateral:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Collateral with this token ID or file hash already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create collateral', details: error.message },
      { status: 500 }
    );
  }
}
