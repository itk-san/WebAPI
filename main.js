
let search = document.getElementById("search");    

let quantity = document.getElementById("quantity");
let resultQuantity = quantity.value;

// セレクトボックスが変更された時の処理
quantity.addEventListener("change", (e)=> {
    resultQuantity = e.target.value;
});

let button = document.getElementById("button");
button.addEventListener("click", ()=>{
    let searchWord = search.value;
    if (searchWord=="") {
        alert("作品名を入力してください！");
        return;
    }
    getAnimeRecommendations(searchWord);
    
});
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
        let animeTitle = searchData.data[0].title_japanese || searchData.date[0].title;

        let recommendResult = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/recommendations`);
        let recommendData = await recommendResult.json();

        // 結果の表示
        let list = recommendData.data.slice(0, resultQuantity);
        if (list.length===0) {
            result.innerHTML = "<p>おススメのアニメが見つかりませんでした。他のものをお試しください。</p>"
        } else {
            result.innerHTML = `<h2>「${animeName}」を見たあなたにおススメのアニメは……<h2>`
            list.forEach(element => {
                    result.innerHTML += `<li><img src=${element.entry.images.jpg.image_url}/><h3>${element.entry.title}</h3></li>`;    
            });
            result.innerHTML += "</ul>";
        }
    } catch (error) {
        console.error("エラーが発生しました", error);
    }
}