// eslint-disable-file no-use-before-define
import axios from 'axios';

(async () => {
  axios({
    method: 'post',
    data: {
      question:
        'how much hours ago an early buyer of $PEPE deposited all 182.9B $PEPE($2.53M) into #Binance',
      // "thread_id": "a5893820-fe2d-48a9-8f56-33ac89e8207d",
      // "blog_id": "9f005298-0593-43e5-a3cd-962a8ac694ed",
    },
    url: 'http://localhost:8021/assistant/conversation',
    responseType: 'stream',
    headers: {
      Accept: '*/*',
    },
  })
    .then((response) => {
      response.data.on('data', (chunk: any) => {
        console.log('====> data:', chunk.toString());
      });

      response.data.on('end', () => {
        console.log('end stream');
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
})();
