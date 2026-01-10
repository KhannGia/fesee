import dbConnect from '../../../lib/mongodb';
import Loan from '../../../models/Loan';
import { NextResponse } from 'next/server';

// GET - Lấy thống kê tổng hợp
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    const query = { walletAddress: walletAddress.toLowerCase() };
    
    // Aggregate statistics
    const stats = await Loan.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          activeLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          repaidLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'repaid'] }, 1, 0] }
          },
          totalBorrowed: { $sum: '$principal' },
          totalRepaid: { $sum: '$totalRepaid' },
          totalInterestPaid: { $sum: '$interestPaid' },
          earlyRepaymentCount: {
            $sum: { $cond: ['$earlyRepaymentBonus', 1, 0] }
          },
          avgLoanAmount: { $avg: '$principal' },
          avgTermDays: { $avg: '$termDays' },
          avgInterestRate: { $avg: '$interestRate' }
        }
      }
    ]);
    
    // Get recent loans
    const recentLoans = await Loan.find(query)
      .sort({ borrowedAt: -1 })
      .limit(5)
      .select('loanId principal termDays interestRate status borrowedAt repaidAt');
    
    const result = stats[0] || {
      totalLoans: 0,
      activeLoans: 0,
      repaidLoans: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      totalInterestPaid: 0,
      earlyRepaymentCount: 0,
      avgLoanAmount: 0,
      avgTermDays: 0,
      avgInterestRate: 0
    };
    
    return NextResponse.json({
      success: true,
      data: {
        stats: result,
        recentLoans
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
