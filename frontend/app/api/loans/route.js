import dbConnect from '../../../lib/mongodb';
import Loan from '../../../models/Loan';
import { NextResponse } from 'next/server';

// GET - Lấy loan history của một wallet
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    const query = { walletAddress: walletAddress.toLowerCase() };
    if (status) {
      query.status = status;
    }
    
    const loans = await Loan.find(query)
      .sort({ borrowedAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Loan.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: loans,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit
      }
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Tạo loan mới khi borrow
export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      walletAddress,
      principal,
      termDays,
      interestRate,
      borrowTxHash,
      creditLimitAtBorrow,
      network = 'sepolia'
    } = body;
    
    // Validate required fields
    if (!walletAddress || !principal || !termDays || !interestRate || !borrowTxHash || !creditLimitAtBorrow) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate unique loan ID
    const loanId = `loan_${walletAddress.slice(0, 8)}_${Date.now()}`;
    
    const loan = await Loan.create({
      walletAddress: walletAddress.toLowerCase(),
      loanId,
      principal,
      termDays,
      interestRate,
      borrowTxHash,
      creditLimitAtBorrow,
      network,
      status: 'active',
      borrowedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      data: loan
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { error: 'Failed to create loan', details: error.message },
      { status: 500 }
    );
  }
}
