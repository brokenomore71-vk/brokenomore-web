import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  // Common Indian stock exchanges as fallback
  const indianExchanges = ['NSE', 'BSE'];
  const queryUpper = query.toUpperCase().trim();

  try {
    // Try multiple endpoints with proper error handling
    const endpoints = [
      {
        url: `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(query)}&exchange=&lang=en&search_type=stock&domain=production`,
        timeout: 3000,
      },
      {
        url: `https://www.tradingview.com/api/v1/symbols/list?search=${encodeURIComponent(query)}&exchange=&lang=en`,
        timeout: 3000,
      },
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tradingview.com/',
            'Origin': 'https://www.tradingview.com',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          
          if (text && text.trim()) {
            try {
              const data = JSON.parse(text);
              
              if (data && Array.isArray(data) && data.length > 0) {
                const formattedResults = data
                  .filter((item: any) => item.symbol && (item.exchange || item.prefix))
                  .map((item: any) => ({
                    symbol: item.symbol,
                    exchange: item.exchange || item.prefix || 'NSE',
                    description: item.description || item.full_name || `${item.exchange || 'NSE'}:${item.symbol}`,
                    fullSymbol: `${item.exchange || item.prefix || 'NSE'}:${item.symbol}`
                  }))
                  .slice(0, 10);

                if (formattedResults.length > 0) {
                  return NextResponse.json({ results: formattedResults });
                }
              }
            } catch (parseError) {
              // Continue to next endpoint
              continue;
            }
          }
        }
      } catch (fetchError: any) {
        // If it's an abort error or network error, continue to next endpoint
        if (fetchError.name !== 'AbortError') {
          console.error('Fetch error:', fetchError.message);
        }
        continue;
      }
    }

    // Fallback: Return Indian exchanges for the query
    // This allows users to manually select NSE or BSE versions
    const fallbackResults = indianExchanges.map(exchange => ({
      symbol: queryUpper,
      exchange: exchange,
      description: `${exchange}:${queryUpper} - ${exchange} Exchange`,
      fullSymbol: `${exchange}:${queryUpper}`
    }));

    return NextResponse.json({ results: fallbackResults });
  } catch (error) {
    console.error('Error in ticker search:', error);
    
    // Final fallback: Return Indian exchanges
    const fallbackResults = indianExchanges.map(exchange => ({
      symbol: queryUpper,
      exchange: exchange,
      description: `${exchange}:${queryUpper} - ${exchange} Exchange`,
      fullSymbol: `${exchange}:${queryUpper}`
    }));
    
    return NextResponse.json({ results: fallbackResults });
  }
}
