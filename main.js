
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
    e.preventDefault(); // フォーム送信の際の再読み込みを回避
    let searchWord = search.value;
    if (searchWord=="") {
        alert("作品名を入力してください！");
        return;
    }
    getAnimeRecommendations(searchWord);
    
});



//　入力された作品名を引数にして、おススメのアニメを取ってくる関数
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
            resultTxt = `<h2>「${animeTitle}」を見たあなたにおススメのアニメは……</h2><ul>`

            // listの数だけHTMLを生成
            for(let element of list){
                try {
                    // click-btnクラスのボタンにdata-id属性でアニメIDを埋めておく
                    resultTxt += `
                        <li>
                            <div>
                                <a href="${element.entry.url}" target="_blank" rel="noopener noreferrer">
                                    <img src=${element.entry.images.jpg.image_url}/>
                                    <div>${element.entry.title}</div>
                                </a>
                            </div>
                            <button class="click-btn" data-id="${element.entry.mal_id}">詳細を見る</button>
                            <div class="popup-wrapper" style="display:none;">
                                <div class="popup-inside">
                                    <button class="close-btn">X</button>
                                    <h2 class="detail-title"></h3>
                                    <div class="detail-content">
                                        <p>読み込み中……</p>
                                    </div>
                                    <a class="translateSender" href="https://www.deepl.com/ja/translator" target="_blank" rel="noopener noreferrer">翻訳サイトへ(DeepLに遷移します)</a>
                                </div>
                            </div>
                        </li>`;
                } catch (error) {
                    continue; // エラーがあっても次ループへ
                }
            };
            resultTxt += "</ul>";
            result.innerHTML = resultTxt;
            // 結果を表示してからボタンにイベントを付与する
            setButtonEvents();
        }
    } catch (error) {
        console.error("エラーが発生しました", error);
        result.innerHTML = "<p>エラーが発生しました。時間を置いて再度お試しください。</p>";        
    }
}

// 生成されたボタンたちにイベントを付与する関数
function setButtonEvents() {
    // あらすじ表示用ボタンのDOMを取得
    let buttons = document.querySelectorAll(".click-btn");
    
    buttons.forEach(btn => {
        btn.addEventListener("click", async function() {
            // クリックされたボタンの次にある要素（ポップアップ）を取得
            let popup = this.nextElementSibling; 

            // ポップアップ内のDOMを取得
            let popupInside = popup.querySelector(".popup-inside"); 

            // 詳細表示用の領域のDOMを取得
            let contentArea = popup.querySelector(".detail-content"); 

            // タイトル表示のDOMを取得
            let detailTitle = popup.querySelector(".detail-title");
            
            // ポップアップ表示
            popup.style.display = "block";
            
            // すでに読み込んでいたら（loadedクラスが存在するなら）fetchしない
            if (this.classList.contains("loaded")) {
                return;
            }
            
            // あらすじ表示用ボタンに埋め込んでおいたアニメIDを取得
            let dataId = this.getAttribute("data-id");
            contentArea.innerHTML="<p>読み込み中……</p>"
            
            try {
                // 詳細データを取得
                let summuriesResult = await fetch(`https://api.jikan.moe/v4/anime/${dataId}`);
                let summuriesData = await summuriesResult.json();

                // 日本語タイトルを取得
                detailTitle.textContent = summuriesData.data.title_japanese || summuriesData.data.title;

                // メイン画像を取得
                let mainImg = summuriesData.data.images.jpg.large_image_url || summuriesData.data.images.jpg.image_url;

                // 情報を取得
                let genres = "ジャンル: ";
                if (summuriesData.data.genres.length == 0) {
                    genres += "ジャンル情報が見つかりませんでした。";
                } else {
                    genres += summuriesData.data.genres.map(item => item.name);
                }

                // あらすじを取得
                let synopsis = "あらすじ: ";
                if (!summuriesData.data.synopsis || summuriesData.data.synopsis == "") {
                    synopsis += "あらすじ情報が見つかりませんでした。";
                    
                } else {
                    synopsis += summuriesData.data.synopsis;
                }

                // アニメの評価点数(10点満点中)を取得
                let score = `評価: ${summuriesData.data.score}/10`;

                // 取得した詳細情報を表示
                contentArea.innerHTML = `
                    
                    <img src="${mainImg}"/>
                    <div>
                        <p>${genres}<p>
                        <p>${score}</p>
                        <p>${synopsis}</p>
                    </div>`;

                // loadedクラスを付与。二度fetchされることのないようにする
                this.classList.add("loaded");
                
                // あらすじ文をコピーするボタンを生成
                let copyBtn = document.createElement("button");
                copyBtn.classList.add("copyBtn");
                copyBtn.innerHTML = "あらすじをコピー";
                
                // クリップボードAPIを使ってコピー
                copyBtn.addEventListener("click", () => {
                    if (!navigator.clipboard) {
                        alert("このブラウザは対応していません");
                        return;
                    }
                    navigator.clipboard.writeText(synopsis).then(
                        () => {
                            if (this.classList.contains("copied")) {
                                return;
                            }
                            alert('クリップボードにコピーしました！');
                        },
                        () => {
                            alert('コピーに失敗しました');
                        }
                    );
                });
                
                // 翻訳サイトへのリンクの前にコピー用のボタンを追加
                popupInside.querySelector(".translateSender").before(copyBtn);

                } catch (error) {
                    console.log(error);
                    contentArea.innerHTML = "<p>情報の取得に失敗しました。</p>"
                }
            });
        });

    // Xボタンまたはポップアップ背景をクリックしたとき、ポップアップを閉じる処理
    let popups = document.querySelectorAll(".popup-wrapper");
    popups.forEach(popup => {
        popup.addEventListener("click", function(e) {
            // クリックされたのがwrapperかXボタンのときだけ閉じる　ポップアップの中身をクリックしても閉じないように
            if (e.target.classList.contains("popup-wrapper") || e.target.classList.contains("close-btn")) {
                this.style.display = "none";
            }
        });
    });
}
