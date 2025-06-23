class Dictionary {
  constructor(apiURL) {
    this.apiURL = apiURL;
    this.init();
  }
  

  init() {
    this.handelSearchWord();
  }
  handelSearchWord(){
    const searchInputElement =  document.querySelector('.input');
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.addEventListener('click',async ()=>{
        const wordInput = searchInputElement.value
        if(!wordInput) {console.warn('Not word in input element')}
        else{

        }
    })
  }
  async callApiDictionary(word){
    const res = await fetch(this.apiURL[0]);
    if(!res.ok){throw new Error('Không tìm thấy dữ liệu từ ')}
    const data = await res.json();
    const = data
  }

}
// Khởi tạo ứng dụng khi DOM đã load xong
document.addEventListener('DOMContentLoaded', () => {
  const list_api=["https://api.dictionaryapi.dev/api/v2/entries/en"]
  const app = new Dictionary(list_api);
});