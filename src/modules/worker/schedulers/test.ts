/**
 * Fetches token data from the Believe Signal API
 * 
 * This function retrieves up to 50 tokens with any follower count
 * from the Believe Signal API and logs the results to the console.
 */
async function fetchBelieveSignalTokens() {
  try {
    console.log('🔍 Starting token fetch from Believe Signal API');
    
    const response = await fetch('https://api.believesignal.com/tokens?count=50&min_followers=0');
    const data = await response.json();
    
    console.log('✅ Successfully fetched tokens:', data);
    return data;
  } catch (error) {
    console.error('🔴 Error fetching tokens:', error);
    throw error;
  }
}

// Example usage
fetchBelieveSignalTokens()
  .then(data => console.log(`Retrieved ${data.length || 0} tokens`))
  .catch(error => console.error('Error in token fetch operation:', error));

