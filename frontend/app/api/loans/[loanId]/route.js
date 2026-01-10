import dbConnect from '../../../../lib/mongodb';
import Loan from '../../../../models/Loan';
import { NextResponse } from 'next/server';

// PUT - Cập nhật loan khi repay
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { loanId } = params;
    const body = await request.json();
    const {
      repayTxHash,
      interestPaid,
      principalPaid,
      totalRepaid,
      earlyRepaymentBonus,
      status = 'repaid'
    } = body;
    
    if (!repayTxHash || totalRepaid === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const updateData = {
      repayTxHash,
      interestPaid: interestPaid || 0,
      principalPaid: principalPaid || 0,
      totalRepaid,
      earlyRepaymentBonus: earlyRepaymentBonus || false,
      status,
      repaidAt: new Date()
    };
    
    const loan = await Loan.findOneAndUpdate(
      { loanId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json(
      { error: 'Failed to update loan', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Lấy thông tin một loan cụ thể
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { loanId } = params;
    
    const loan = await Loan.findOne({ loanId });
    
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan', details: error.message },
      { status: 500 }
    );
  }
}
