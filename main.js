
// テキストボックスのDOMを取得
let search = document.getElementById("search");    

// セレクトボックスのDOMを取得、セレクトボックスの値を変数に確保
let quantity = document.getElementById("quantity");
let resultQuantity = quantity.value;

// フォームのDOMを取得
let form = document.getElementById("form");

// セレクトボックスが変更された時の処理
quantity.addEventListener("change", (e)=> {
    resultQuantity = e.target.value;
});

// ボタンクリックあるいはEnterで送信された時の処理
form.addEventListener("submit", (e)=>{
    e.preventDefault();
    let searchWord = search.value;
    if (searchWord=="") {
        alert("作品名を入力してください！");
        return;
    }
    getAnimeRecommendations(searchWord);
    
});



//　入力された作品名を引数にして、おススメのアニメを取ってくる
async function getAnimeRecommendations(animeName) {
    let result = document.getElementById("result");
    result.innerHTML="<p>検索中……</p>";

    try {
        // 初めに入力したアニメのidを取ってくる
        let searchResult = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeName)}&limit=1`);
        let searchData = await searchResult.json();
        
        if (!searchData.data || searchData.data.length === 0) {
            result.innerHTML = "<p>入力された作品が見つかりませんでした。他のものをお試しください。</p>";
            return;
        }
        
        // 取ってきたidからおススメのアニメを取得する
        let animeId = searchData.data[0].mal_id;
        let animeTitle = searchData.data[0].title_japanese || searchData.data[0].title;
        
        let recommendResult = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/recommendations`);
        let recommendData = await recommendResult.json();

        // 結果の表示
        let list;
        if (resultQuantity == "") {
            list = recommendData.data;
        } else {
            list = recommendData.data.slice(0, resultQuantity);
        }
        let resultTxt = "";
        if (list.length===0) {
            resultTxt = "<p>おススメのアニメが見つかりませんでした。他のものをお試しください。</p>"
        } else {
            resultTxt = `<h2>「${animeTitle}」を見たあなたにおススメのアニメは……<h2>`
            list.forEach(element => {
                resultTxt += `<li><a href="${element.entry.url}" target="_blank" rel="noopener noreferrer"><img src=${element.entry.images.jpg.image_url}/><h3>${element.entry.title}</h3></a></li>`;    
            });
            resultTxt += "</ul>";
        }
        result.innerHTML = resultTxt;
    } catch (error) {
        console.error("エラーが発生しました", error);
        result.innerHTML = "<p>エラーが発生しました。時間を置いて再度お試しください。</p>";
    }
}