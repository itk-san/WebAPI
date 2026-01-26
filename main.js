
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
    result.innerHTML="<p>検索中……(この処理には時間がかかる場合があります)</p>";

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
            for(let element of list){
                try {
                    
                    resultTxt +=
                        `<li>
                            <div>
                                <a href="${element.entry.url}" target="_blank" rel="noopener noreferrer">
                                    <img src=${element.entry.images.jpg.image_url}/>
                                    <div>${element.entry.title}</div>
                                </a>
                            </div>
                            <button class="click-btn" data-id="${element.entry.mal_id}">あらすじを表示(英語)</button>
                            <div class="popup-wrapper" style="display:none;">
                                <div class="popup-inside">
                                    <button class="close-btn">X</button>
                                    <div class="message">
                                        <p class="synopsis-content">読み込み中……</p>
                                    </div>
                                </div>
                            </div>
                        </li>`;
                } catch (error) {
                    return;
                }
            };
            resultTxt += "</ul>";
            result.innerHTML = resultTxt;
            
            setButtonEvents();
        }
    } catch (error) {
        console.error("エラーが発生しました", error);
        result.innerHTML = "<p>エラーが発生しました。時間を置いて再度お試しください。</p>";        
    }
}

function setButtonEvents() {
    let buttons = document.querySelectorAll(".click-btn");
    
    buttons.forEach(btn => {
        btn.addEventListener("click", async function() {
            let popup = this.nextElementSibling; 
            let contentArea = popup.querySelector(".synopsis-content");
            let popupInside = popup.querySelector(".popup-inside");
            
            popup.style.display = "block";
            
            if (this.classList.contains("loaded")) {
                return;
            }
            
            let dataId = this.getAttribute("data-id");
            contentArea.innerHTML="<p>読み込み中……</p>"
            
            try {
                let summuriesResult = await fetch(`https://api.jikan.moe/v4/anime/${dataId}`);
                let summuriesData = await summuriesResult.json();
                let synopsis;
                if (!summuriesData.data.synopsis || summuriesData.data.synopsis == "") {
                    synopsis = "あらすじ情報が見つかりませんでした。"
                } else {
                    synopsis = summuriesData.data.synopsis;
                }
                
                contentArea.innerHTML = `<p>${synopsis}</p>`;
                this.classList.add("loaded");
                
                let copyBtn = document.createElement("button");
                copyBtn.classList.add("copyBtn");
                copyBtn.innerHTML = "あらすじをコピー";
                copyBtn.addEventListener("click", () => {
                    if (!navigator.clipboard) {
                        alert("このブラウザは対応していません");
                        return;
                    }

                    navigator.clipboard.writeText(synopsis).then(
                        () => {
                            alert('クリップボードにコピーしました！');
                        },
                        () => {
                            alert('コピーに失敗しました');
                        }
                    );
                });
                let translatorSite = document.createElement("a");
                translatorSite.href = "https://www.deepl.com/ja/translator";
                translatorSite.innerHTML = "翻訳サイトへ(DeepLに遷移します)";
                translatorSite.target = "_blank";
                translatorSite.rel = "noopener noreferrer";
                // target="_blank" rel="noopener noreferrer"
                popupInside.appendChild(copyBtn);
                popupInside.appendChild(translatorSite);

                } catch (error) {
                    console.log(error);
                    contentArea.innerHTML = "<p>情報の取得に失敗しました。</p>"
                }
            });
        });

    // 閉じるボタンと背景クリックの処理
    let popups = document.querySelectorAll(".popup-wrapper");
    popups.forEach(popup => {
        popup.addEventListener("click", function(e) {
            if (e.target.classList.contains("popup-wrapper") || e.target.classList.contains("close-btn")) {
                this.style.display = "none";
            }
        });
    });
}
