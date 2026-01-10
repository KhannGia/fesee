import dbConnect from '../../../../lib/mongodb';
import Collateral from '../../../../models/Collateral';
import { NextResponse } from 'next/server';

// GET - Lấy thống kê collateral của user
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
    
    // Get all collaterals for this wallet
    const collaterals = await Collateral.find(query);
    
    // Calculate stats
    const stats = {
      totalCollaterals: collaterals.length,
      totalValue: collaterals.reduce((sum, c) => sum + c.estimatedValue, 0),
      availableCollaterals: collaterals.filter(c => !c.isLocked).length,
      lockedCollaterals: collaterals.filter(c => c.isLocked).length,
      availableValue: collaterals.filter(c => !c.isLocked).reduce((sum, c) => sum + c.estimatedValue, 0),
      lockedValue: collaterals.filter(c => c.isLocked).reduce((sum, c) => sum + c.estimatedValue, 0),
      totalLoanAmount: collaterals.filter(c => c.isLocked).reduce((sum, c) => sum + c.loanAmount, 0),
      
      // Group by asset type
      byAssetType: {},
      
      // Recent mints
      recentMints: collaterals
        .sort((a, b) => b.mintedAt - a.mintedAt)
        .slice(0, 5)
        .map(c => ({
          tokenId: c.tokenId,
          assetName: c.assetName,
          assetTypeLabel: c.assetTypeLabel,
          estimatedValue: c.estimatedValue,
          isLocked: c.isLocked,
          mintedAt: c.mintedAt
        }))
    };
    
    // Count by asset type
    const assetTypes = ['Máy móc thiết bị', 'Hàng tồn kho', 'Bất động sản', 'Phương tiện', 'Hóa đơn', 'Khoản phải thu', 'Khác'];
    assetTypes.forEach((type, index) => {
      const items = collaterals.filter(c => c.assetType === index);
      stats.byAssetType[type] = {
        count: items.length,
        totalValue: items.reduce((sum, c) => sum + c.estimatedValue, 0),
        locked: items.filter(c => c.isLocked).length
      };
    });
    
    // Average LTV for locked collaterals
    const lockedItems = collaterals.filter(c => c.isLocked);
    stats.averageLTV = lockedItems.length > 0
      ? Math.floor(lockedItems.reduce((sum, c) => sum + c.ltvRatio, 0) / lockedItems.length)
      : 0;
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching collateral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
