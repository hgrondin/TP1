let contentScrollPosition = 0;
let pageManager;
let currentETag = "";
let filters = {};
let categories;
let selectedCategory = "";

setAllCategories();

Init_UI();

async function Init_UI() {
    filterCategories();
    filterKeywords("Test lolo");

    //renderPosts();
    itemLayout = {
        width: $("#sample").outerWidth(), //La longueur extérieur de l'élément
        height: $("#sample").outerHeight() //La hauteur extérieur de l'élément
    };

    pageManager = new PageManager('scrollPanel', 'itemsPanel', itemLayout, renderPosts);

    showPosts();

    $("#searchIcon").on("click", async function() {
        pageManager.update(false);
    });

   // renderPosts();
   /* $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    $('#abort').on("click", async function () {
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });*/
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de publications</h2>
                <hr>
                <p>
                    Application de gestion de publications pour le TP1 de services web
                </p>
                <p>
                    Auteur: Henri Grondin et Marc-Antoine Bourchard
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}


function showPosts() {
    $("#actionTitle").text("MONTRÉAL POSTS");
    $("#createPost").show();
    $("#abort").hide();  
    $("#scrollPanel").show();
}
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}

async function renderPosts(queryString) {

    queryString = buildQueryString(queryString);

    /*queryString += "&sort=category";

    if (selectedCategory != "") 
        queryString += "&category=" + selectedCategory;*/

    let response = await Posts_API.GetQuery(queryString);

    if (!Posts_API.error) { //S'il n'y a pas d'erreur, on peut continuer

        /*TO DO: Faire la gesiton avec le Etag (voir appUI.cs du projet Bookmarks2)*/
        //currentETag = response.ETag;
        let posts = response.data;
        let counter = 0;
        posts.forEach(post => {
            let words = post.Text.split(" ");
            let text = post.Text;
            let wordsLengthMore = false;
            if (words.length > 30) {
                let wordsCount = 0;
                let indexWord = 0;
                for (let i = 0; i < post.Text.length; i++) {
                    if (post.Text[i] == " ") {
                        if (wordsCount+1 == 30) {
                            indexWord = i;
                            break;
                        }
                        wordsCount++;
                    }
                }
                text = post.Text.substr(0, indexWord);
                wordsLengthMore = true;
            }

            $("#itemsPanel").append(renderPost(post, text, counter, wordsLengthMore));

            if (wordsLengthMore) {
                $(".seeMoreDescriptionPost").on("click", function() {
                    let id = $(this).attr("seeMore");
                    $('[completeDescription="'+id+'"]').show();
                    $('[descriptionPostId="'+id+'"]').hide();
                    $(this).hide();
                });
            }          

            counter++;
        });
        /*
        for (let i = 0; i < 5; i++) {
            $("#itemsPanel").append(renderPost(i));
            $(".seeMoreDescriptionPost").on("click", function() {
                $('[descriptionPostId="'+i+'"]').text(descriptionTest);
                $(this).hide();
            });
        }*/

        showPosts();
/*
        if (Posts.length > 0) {
            Posts.forEach(Post => {
                $("#itemsPanel").append(renderPost());
            });
        }*/
    }

    return false;


   /* for (let i = 0; i < 5; i++) {
        $("#itemsPanel").append(renderPost());
    }*/
}

function renderPost(post, textDescription, descriptionPostId, wordsLengthMore) {

    let elementsWordsLengthMore;

    if (wordsLengthMore) {
        elementsWordsLengthMore = `<p class="descriptionPost text" completeDescription="${descriptionPostId}" style="display: none">
                                        ${post.Text}                 
                                    </p>
                                    <p class="descriptionPost text" descriptionPostId="${descriptionPostId}">
                                        ${textDescription}...
                                    </p>
                                    <p class="seeMoreDescriptionPost seeMore" seeMore="${descriptionPostId}">Voir plus</p>
                                    `;
    } else {
        elementsWordsLengthMore = `<p class="descriptionPost text">
                                        ${textDescription}                 
                                    </p>`;
    }

    return $(`
<div class="postContainer">
            <div class="globalTopInformationsContainer">
                <div class="topInformationsContainer">
                    <p class="categoryPost text">${post.Category.toUpperCase()}</p>
                    <div class="titlePostContainer text">
                        <p>${post.Title.toUpperCase()}</p>
                    </div>
                </div>
                <div class="iconsContainer">
                    <span class="fa fa-edit icon"></span>
                    <span class="fa fa-trash icon"></span>
                </div>
            </div>
            <div class="imageAndDateContainer">
                <!--Image temporaire-->
                <div class="imagePost" style="background-image:url('${post.Image}')"></div>

            </div>
            <div>
                <p class="dateLastModificationPost text">Jeudi 31 octobre 2024 - 12:22:18</p>
            </div>
            <div>
                ${elementsWordsLengthMore}                
                <!--<p class="descriptionPost text">Le ministre de l’Immigration, Jean-François Roberge, a déposé ce matin son plan annuel d’immigration.</p>-->
            </div>
        </div>
    `);
}


/*
function renderPost() {
    return $(`
        <div class="postContainer">
            <div class="globalTopInformationsContainer">
                <div class="topInformationsContainer">
                    <p class="categoryPost text">IMMIGRATION</p>
                    <div class="titlePostContainer text">
                        <p>Explosion de l'immigration permanente au Québec: un seuil de 67 000 prévu l’an
                            prochain
                        </p>
                    </div>
                </div>
                <div class="iconsContainer">
                    <span class="fa fa-edit icon"></span>
                    <span class="fa fa-trash icon"></span>
                </div>
            </div>
            <div class="imageAndDateContainer">
                <!--Image temporaire-->
                <img class="imagePost"
                    src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUSExMVFRUVFhUVGBcVFRUVFxUVGBcWFxUVFRYYHSggGBonGxUXITEhJSkrLi8uFx8zODMtNygtLisBCgoKDg0OGhAQGy0dHx0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tKy8tK//AABEIAKgBKwMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAAEAAIDBQYBBwj/xABBEAABAwIEAwUEBwcDBAMAAAABAAIRAyEEBRIxQVFhBhMicYGRobHBByMyQlLR8BQzYnKCkvFjsuEVJFOiQ6PC/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAJREBAQACAgIABgMBAAAAAAAAAAECEQMhEjEEEyJBUWEFQvAy/9oADAMBAAIRAxEAPwDxSibo6mEDRF1Y0moDlUWUuSCa7PNNxQsnZNTc6qNJh1yClQ3rApWhVdLFVqY+sp6m/iZ8xt8FYYTGU6n2XCeRsfYd/SVlpQloQ+ZjwH0RgCFzUfV+oSJadn2O7ppm1/iVP2jfFA/zN+KgyapFJvr8Soe1Nb6j+pqoKaliUZSxaoab0XSels2io4pH4fFFZyhVVhQrJ7JpcPieqsaGI6rM0KpVjQqFVsNHSxCMpYhZ+g4o+jPNPZLyniESzEKmpNPNF0qaewtBiEjiEIympe7CNgqeIsmuxS42iRYiD6JFiWwY7Eyha1Q9UWWqOrHRAVlR7kNU1KwqPbzCGqVm80tmrqtJyCq0CrKtimhV2Ixzf1CnYBVaJQzqKlr5k3l7wg25mHiQLeaWzT0qazGKoufizTbuXTP4W2JK0OHxkujogsPUjE1XRuB8k5SWVHCgCBsE+oABJsB8FEcZ+rKgzfNHVDobMTw4nh6qiQ5tmJqO0snSDHWeg4uPJOpZG8gEua3oWhxHmeJRGW4Lu/EQNXt0zy68yjH4sA3cB6ph5ThaQFEvO5cAPIbqegVXXgDgEThqioCsePCEV2XZNU9GlCZgfCz1Vj2THieegCV9BscM4hoXK2CpVPtME8x4T7t1Cx5U1OsszMbg61P91U1t/DU+R/KENm2YEU4qUnMdI6tPr/lWlLFNmDKtaXd6HCo0kEWEiP6gQZCRgcp/dM8kN2o/cf1t+asMFZjWiIaABHADYKr7Xu+ob/OPg5MmbpouiqphPNE0gka6pEc0bRqt5hUVIIykFIX9HEt5qxoY1vVZ2gFYUUbC9pZqzkTHkj6Gat5R6rMinB1XExMcVJXqQLT5H5J7oaxmbt5e4qdudgfoD4lYKliDsVNPsVyWk3Yz9vMf3N/NTUM7D3NYC0lxgDVMk8LBefC3krvs12OrYgGs+qxrCTogFzrHiLAe1Oy66KNdnOI7hwAsHCRMmTx+SqH5y79NPzKdm/YOpUuyuJ5OaQB5ESqPA1e6Y1j3S4fa4yfMowx+wtWb82f/ABewISvmr/4vaB8kw5myTytAtbmg8RmTDstPCF5G1syf1/uKDq5i7l7S781FXxgKBq10vCDyFHGuJ2b7FGzEk3MXtsgxW3SefshK4zRyjK97ahe1oTBTDRpGwRD2ix/WxUvdwPj+S52uGPldK4Oc0yB7UFXqvBJmCd4tMbKyrqtxBHFE26fl4z7K/EYh8fbPtKFw+ZOpO1QHDiDv1g8Cp8WICqa4VxnnjGyo49tZgdTNuJO4P4Y5+7zSDWjgPj71kcix3dVdJPgfY9HfdPy9Vqe8Wkrms0800mFDSkFelV+xRaNiq2t2TdvCpO2Yxp8DPVW/ZzB6mF0kGVDmuVPBawNMiVdZLgyykGkwbkiR8ClTiZlKq3YhyKwrqjnNaWGXEAEdTxT2tcORVt2eP17JHE/7TCjRrDD5a1jQ5wl3wTMZUaRtdaTMqbQALX5rL4oiSLCFNlehx4Y69KmpW0ulu4v5gbjr5KHPcQKrAwiIcHWIvaBE9DKHzB3jBbzj5ILN8U2nQp1TOku7uBvIlw9wRGHLjjMjW4Fg/FPLUz9bo7Osup0TRDCT3lBlUzG7nPFoG0NCzR7SUtRdpqSTP3ec8+qDz3PTiKjHN1tDaTKcE8W6pNjtdGqzz8P6tPTCMpBVGQz3QnmfirqkFLMVRCOpISiEUaoYNTrAJB3MscKNPUdyQ1o2lxvc8rFVjTi6w1AGONtLY5t4+pJRYZTxdWkzdrNTzax2AF/M+1ayoyGwLdAqmU106OPh3/1087c7F02wbxPL3FD5JntbvRSrAEOnSdiCATB5/n5rVZvR5LC5pTkEj7QMiNxyVYZXY5uGYzcbXvhuFsOx3altFppVAdEyCLlpO4I4hedd/LQ4cQD7QpaGMMbLW1yPXM77ZUmMIpS55FjsGyN+p6LzStXJO6CdjCUz9oPREosaXMezGJo0P2h+nTAJAcS5odAGoRG5GxO6zznHmrrNu2mIr4YYdwYB4Q5wB1ODYIm8C4Ews0Kjk/KjUSvJ5qB/mU11R3NQvqHmlujR5JGyJoOkg9VWveeaNwDxZvGJ9BH5pW9GuMZXFNpe7Zsn2A2VPhu0L3+IMlp2gETe9zf3KyzTC95ol5DATqaPviLD/KqsrwB1EeINDqgBl0adZ02neOCxupHVw40eK1aoCe7psHMuc4+wNHxVJizVDjL2j+VkfElaWo5tNsTZZ7MKk3ghKVtcUTaRIbLi/UYAgCOpIG3RVuY0+7eRM7j1ESPeEfQBcQQLNvvcxsAFW5jVFR5I2HvJAHwaPeqicpPFWVn8t1uwsFihC3LHWEm8CfPirjkze7VcrYeCFrZCwiICuu8CWsK2emTqdj6RM6boXF9jqZEaR7FtdYSJCA8qxnYZrfshwP8ACSFDlPZ6pTrN1vc5v4XAH38916tUpgoDFYUbpaVLqsP2kwVUt0sqX2GoajE2i4i0LG9oMBVo0A4VQ421GCSDJBAdNrRw5r1PMsNqaRa/HksD2swgcwM+s0tH3T8AeCmx2YZzWmSxOHeabXBzQ2Af4pI4uJufRVPaOsTRY3hLXxwn61pPu9yuqmCJpNaySJIlwiLzdVPaWBSpsg7zq4eEOEdLvJUxHLpVUcvYWgmduadUwLA0lsyOpn2eSnwxpkQ+3n8iETiO5togRBtutLn9pGGPFbN7E5Vi30jRY6nZz2iSZmXDh68eS0NLEuqfteim3VRrhjZJAjW8O9wCpanjdSdJhrmP28ifgi/2ttMY5wcGipWY5moRqGpznR6FZ6hX2tswpYllZ7KYp6ARpLiZIIBuAOqacLjKggmiB5OKpGZ4+odRc9x/EGmLeQVplecOe8NMmbAjaRwPIpXA5bO1xkeCq0H6qjmOER4GkRxMnjsrVmcCpU7tkE3mCHRYxMbXQ1B7pEg+uyKfimMc0NFyC4wCTAiwjqQpmMnUdvDnlnu27rPYvMK9QvLWGGEttBJI8yLfks5iqbhd4EuJtyPorSjj9NR7dLjTLiTqEQbXE3VdnFUl1/TyKas8etp6NOoWANMNAN+NyVExz2GNU9Dx5weCZTx9UAtpsbA1bm8tmbDqIQNWrVI1OcLjg0hPdc+WONnUaKlSc5wA2JAnpO60uTYDC1qtWmNf1TtLptfmDxWe7OYnwU3vcBpeLnYNBFyoMVm573Gmi4aX95UY9sg6gBGk9b2W+Fkm3HnjbdN0MLlDH93VrN1TEGqBfkb2PQrRYfsvgDtRJEAg6nH5rxL/AKkNOx8IB+zz5E7leudhe2FAYGmzEVWYcsljS/w62NPhLZ3tAJHJE5Jfc0M+G4z3sViuzWEBtQjzkry3OMIW1KoAgB7xHKCRbpZe5VaorM10qgqNOzmOa5p8iCvH+1ZIxFYEX1O+Eqs7LJpGEst2yNdwYW7+Iwdzws74foIjAViK7pgNbTFzYCSN0JjKhIHhcPOL+9E4J1LQ91QS0st4i0F4LQCYu4NkmOPlKx231Olzm+b0wzWyqHFsfVgt8R2vIn2LuVZkxzN7t3+KzGJqUidLQOHvRlHBNkd2HC5D5M7cVM7dOOeWHW9rOviCX3Nv8obGDUCf11UeLJMR19wNlJSMATsefNPR/MlVOIc9rdMkN3tbohmxp9yscUNSrakNmTAU09gcUd1qKGcUNI+sYLCxMGeKxuLxQNm7c/yQi0xnTlzst6fWZzPqmvzTqsccy6pv/Uuqpk2dLMuqKZjlhqeY33RrMzHNBtc7HBB1swnis/UzG26Bfj+qA0T8YOKz2eVWHjCHqZhPFBV61Bzh3xcG9PmRcBLW1S6U+bZlTb4GweZHl/j2LFVs+cKrh9qnAYW+UyR1klbPtRgKVGjVqt8MDS2+qXuMN36mfIFeZ6FWWGuqfld7Gtrw4hv2D9mRtPAoytiBYHe0qsZZTUa2k6gBPUbHn5qfBWPJppmVA1sA/ZiQOBiYVdj8x0ktcybtcJjkIPsWf70h0hx3n8/NLFYkvILt4A4DYQNuiPFG+9tPhs/bpNoiBAO5Kbkz5xNN8loLoIEy4wYmOExdZWmbrQ5DjKdN/ev1eC7GtH2iZBvwhTcfw1+Z5T6nqOGO/p8lDiR4iGu0v07iC5oO1j1B9iwmM7T13yGnu28m/ajq7f2Qtx9GPZ9lXD1a9QEvqvhrpMhrCRIniXap5wEfLui4uTwyUmYUNZFqhjcuOlvsESqqq013tA6N24DdyP7V4vTVfTZU7xjDp1TpDiN4ETAMiZ4LWdnMkpGgyoGuYXiSKgGq3kY0qZjbXXz5eOMv5eU5ljDTxFYC7S6CLiYaAfIrgxmpsRHLihMY4VKj3/ie539zifmmUwQtvCOGZ5TpqDmbO7Y1jgCDcEHZQUcQ5z7kOBB2tAPNUUqShmLqTgRsdxzCV45vZzk60sq1YhxZMBt45jko/HiHEl23HlyAHBNx2KpupMqNPiI0nzEb9UssBgOmBMmOIJvPNZ6XL5D8HmmJwD9VKq9tN0B4B36kcxzVvia7qgNQuLi6TqPHrKzeKoghzpPHyMbG6LyXHaqOkm7Zb6cPcYRj+Szmld2gxLmGnEbO+SbltcdzLrw4iI6Db1U3aDDuqMZoaXEO2AkwRy84XMvyWqxv10NYTdm7pIs4xYRYq9bZzLTmArA1W6miS9ptERIst7gcMNJ2l1zz4leb1MK5j7uJLTPz9q9FyzEtqUw/jADhycN0SaVlltX43C6TwiSVV4moBafYp+0vaClTljIc7zsPYsRicxqPMkx5WRoplpf4vMKdIEEy48Bv/wALN4vFOqGTYcANgoUkSaPLO1xJdhJND1P9v6oarmkKjOLsg6+KKCaRmcxxRlDNp4rDNroqliig26bmvVD18y5LLMxhTxikgvBjTO6s8oeHPk3jboeayjMQrrJMVBLuXx4J4+wg+kfF63sot+ywSRzdcSet3e1YepvHqrrOMVrqOdzJ9nBUYMmef6Cu3dJO4wFExpfYf4SxToCnpnQwDiQCfUSPRKhH+zMbv4jzO3oEJVZy/wCQpK1ZDtKkxLcOQzVIuQN7jzCKohC0pNyj6DLKsDyKF9AZPRGDy0F3/wAVAvM8SGl1/M/FeIZLhO9xNGkPv1aY9NQJ9wK9x7eP0ZfUaJGrQwRvdzZA9AU8+lcWPlnJ+a8aw8B9J9Qaga1Nz54guvI5mSY9q9b7S1u6wmIq2EUnhvCCRoZ/7EexeXUqcvZb77AI5ahsTwnjxK230uYvu8E2lxq1Wj+mn4yf7gz2qMHd/IYzHPF5QxugPDCRYapAILehItx2QrFHVxDo0yY5JNrCE8Nz25vic+LOy8WPj+f9/tnVHwhqjpK5VfLgkRbzsqtczlU+ADq4+tlbZNiPBBkXIkbqqezw+SLyJ5lw4W9qzrTG6ovHV9LCGyZtJnjbim5NXDdQJjVEdTH+F3OR4Qev5qrbVEQZtxG4IUw8rut3Tq6GwN/vHmfyCgxuLaymXPuDaOJJEABUP/XWlukgzwPA+aizXEanNbNmiT5n/iFvMpJ0wuPZYvGkgC0gAE7kwI3Q7MQ4NIDnAbwHEAnqFAuVXWKhYQ7pJQnQgGpLqUIBqS6kgLd1VQPeuFyY5IHBymY9CSntegCu9hIV0MXJoKQWNOqrejW0USeJt8vhPsVHhwrXOAGBjOTRP69qcCmxlSbc/goGp1Njqj2taJc9wa0cyTDR6k+9aDLsiZTr1MNjG6akN7uH2m5dBafFaInkU7dHjjcqCybD4cPp1saXCgSYYwS6ppm5G4p6hpJFyZA2JFbnWYNq1qlRgc1r3FwDyCWg7NkWgbAcAAE7tBRqMqkPM8GkCAWiwAH3QBAjgq5zUb2Vmuqa5daVxIBIDsLWBZp0iQQdXS9oR9MgNVVhTujtVgtMSrVfRuNWYU3R+7a9484DPg8r0f6TMaDh6LJ+1ULjyhjSL9JeLcVgPoppF2LfH/jA9C4T8FpvpJf9dRpifBT1er3HYc4aL8FGbr+Cx3zT9KHs9R7zF0GkW71hjq3xX5uhu3AIr6acTOJoUf8Ax0S71qPIPupD2rvYVgOPo7W7w/8A1vFuknfiqP6UMZrzDEHgwspj+ljf/wBEowa/yN3ySfpkKqHepg63mo3hOvPRUjdTuN4HD2BD090Q4gCAiBFVO/JWvZpk6/T5qpcBFlcdlt3+nzU1WPsV2hoxRn+JqzJctf2lH1Duhb/uCx6UPL2SLDpudyhGiTCJlNJ8qKuU8KKqbpg1cXVxIOrhSCSA4kuriAL1Lhco12UA5JcBXUB0FSMYmMCMoU0gOyrD6nsbzI9m5XM/qh9Z/ATHoLWSo4ruzqG4mPOCJ96rq9QuJJNzJ9TxVT0K030dOpftL2Oa2X0iKbiAS1zSCdM7GL/0q67XYilV0d40trUnfaB0lpHJ3EGxCzLX0aoZUw7hh61ODA2kC5ub8b8ZuocXjyTL3NceJEmT6+vtWWXt18escdU7tJT7wauEBwPWLz6rMNBVtXxJfbhNmj3eqqC66rBjy2W7JwVjVwYOHbWG8hpAAAgS2THGePVVpK0FHBuODa0VGHWS6CSNMOBizTJseKdRjjb6UlARdGYe/oV3EZe+kJOkj8TTIXMIbHz+S0xTZr23v0RP/wC8qD/S+BP5ovtzideNrbQ3Qzfg1omeQ1arcUH9D7f+7qn/AEwPeUFm1bVXrO51qhte5eY83HhyCjOvQ/jp9dv6aP6NaU42fw0nkyLySxonlYmAvN+1eLNXF13c61V3oXu0/wDrC9N+jQ6XYip+FjB0ElxN+J8Ikrx1ry4lxuTc9SUY+mPxt3zVIdkxrl1xsoSVTlOc26ew9FyZC4CeCAdWdAgcVZ9nbBx6j4KoIKscnoEyZgdPyRrYnS4z100H3/D/ALgsitDmlOKTr8viFnkrNHbs+kpZUYMBOlIkgULjdSAqEbpg5cKSRSBFIpLiAS4uriAIhKFJC5CAaAnAJLrSkEjBCKa6EC+pspm1E9Kx7qeo8EO6Cb/zNHzVXVqEqevcHyJ94QrSmWXs0BLUeacUxIhVPGRMNFxF76dvE3a/5oVzkk1AaHJcnYGftGItTvoZMGoRxJ4Mt6rTtw37SwvmmwUzpiIDGgCwA8157UxL3Na1ziWtEAE2AVxl+atawauQY5oloe0fZJI4qbHRx8mM6ifPSBqawy0DfblPvVNhasW5qXMscHmG7cfyHQIWiVWPTLky8q9H+ietpxFU/wAA/NUhqy4nmTsedyB1PE8FZfRtapVd/C/4ALL0qthfgBY+4fMoydXwefjt6X9HjxorjmWC20Q77PS68gpkQN/10henfR/ibVRPFp9ki3RebYxumpUbye8exxCMfTD4m75KiqFRrrimpsT6XFdBulhxdXIy8igC5ukO1OpuI/eERLPZJE8kBSucuU6xE+Jw8iVaYHJjWg941oPCCSPRPx/Zt9ITqDwN4EH2JeU2rwy1vSprVnXGokdTMrlNnFKBwXDUQk5xXAUyV1hQD5UbE5xTWJg5JJcQCSSSQCK4kkkB4ASriIUVax3/AF0UTnl1kjPc9NY5RPkbroNkyJ8kk8kQw2HohXG0e1EUWwL+zkg5dFVceHUeigaiH1UOTdMq6mkLspIBhXE4pqQJT4dsyEsFRD3tYTpDjpneCbD0mFNWwj6Lyx4g+4jmDxCWwhrMACVIbJzwnPsFUDc/R1bV1Y/3uCxLiR+vcj+zGfHCvlw1MIIMbgGNueyjzWlTnXSeH03GR+Jk/dcNx5pVpx3TQdg8d9Y5p3c34LOdoWacVXH+o8/3HV80f2VhlTvHPa3gASL3BJ6bR6oTtTVDsTUc0yDpMj+UBELO7u1SVxJcTQJwvFbjJcwFbD9y+mXNpCJiYt4CORssPh7BXOQ50cO+PuvIB6HafJLKbi+PLWTmV41lLW4t8RuwnYFpMgjnsu1c1dVJOw6IvtaGkMOjS95MwIBPA234XWdY4RB3CjW+2tyuP0h8SRqdG0lRLpK4rc5Sn00qTZIHNEYmmGkAbIPQeoutXHroQRJJJIBJLiSASSS4gLGrSBYdydx+SEp0XadW3AJJIVjNuspA/aMco3J5JlVpFlxJNJUheT+inOekkkEZK4upIDoSSSTBpTUkkgcxxBkbi481tMyo/tFAPBvpD28bxJHSbhJJZ5/aqxZMptc280klqlEFMWhJJAN0ngm1Xkm5kwBysBA26BJJAMSSSQBTbBQ1XJJICwp5280jSf4haD94Aeadnz6LxTqUoaXNiowfdeLE+u/qUklOlXK32p0kkk0i8Dh9Wp34QI8zP5e9R1HzvwSSSNE9dC6kmTiSSSASSSSA4kkkgP/Z"
                    alt="Image en lien avec la nouvelle">
            </div>
            <div>
                <p class="dateLastModificationPost text">Jeudi 31 octobre 2024 - 12:22:18</p>
            </div>
            <div>
                <p class="descriptionPost text">Le ministre de l’Immigration, Jean-François Roberge, a déposé ce
                    matin son plan annuel d’immigration. Les chiffres dévoilés indiquent que le Québec
                    accueillera
                    en 2025 entre 64 000 et 67 000 nouveaux arrivants permanents, soit environ 10 000 de plus
                    que
                    cette année.</p>
                <p class="seeMoreDescriptionPost">Voir plus</p>
                <!--<p class="descriptionPost text">Le ministre de l’Immigration, Jean-François Roberge, a déposé ce matin son plan annuel d’immigration.</p>-->
            </div>
        </div>
    `);
}*/


function renderCreatePostForm() {
    // TODO
}
async function renderEditPostForm(id) {
    // TODO
}
async function renderDeletePostForm(id) {
    showWaitingGif();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait d'une publication");
    let post = await API_GetPost(id);
    eraseContent();
    if (post !== null) {
        $("#content").append(`
        <div class="postdeleteForm">
            <h4>Effacer la publication suivante?</h4>
            <br>
            <div class="postRow" post_id=${post.Id}">
                <div class="postContainer">
                    <div class="postLayout">
                        <div class="postTitle">${post.Title}</div>
                        <div class="postText">${post.Text}</div>
                        <div class="postCategory">${post.Category}</div>
                        <div class="postImage">${post.Image}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deletePost').on("click", async function () {
            showWaitingGif();
            let result = await API_DeletePost(post.Id);
            if (result)
                renderPosts();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderPosts();
        });
    } else {
        renderError("Publication introuvable!");
    }
}
function renderPostForm(post = null) {
    $("#createPost").hide();
    $("#abort").show();
    eraseContent();
    let create = post == null;
    if (create) {
        post = newPost();
        post.Image = "images/no-image.jpg";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>

            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Nom"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${post.Title}"
            />
            <label for="Text" class="form-label">Contenu </label>
            <textarea
                class="form-control Text"
                name="Text"
                id="Text"
                placeholder="Contenu de la publication"
                required
                RequireMessage="Veuillez entrer le contenu de la publication" 
                value="${post.Text}" 
            >${post.Text}
            </textarea>
            <label for="Category" class="form-label">Catégorie </label>
            <input
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Categorie"
                required
                RequireMessage="Veuillez entrer une catégorie" 
                value="${post.Category}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image </label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Image' 
                   imageSrc='${post.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        showWaitingGif();
        let result = await API_SavePost(post, create);
        if (result)
            renderPosts();
        else
            renderError("Une erreur est survenue! " + API_getcurrentHttpError());
    });
    $('#cancel').on("click", function () {
        renderPosts();
    });
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

async function setAllCategories() {
    let categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
        }
        updateSelectOfCategories(categories);
    }
}

function updateSelectOfCategories(categories){
    let select = $('#searchSelect');
    select.empty();
    let selected = false;
    if (selectedCategory == "")
        selected = true;

    select.append($('<option> class="category"', {
        value: "all",
        text: "Toutes les catégories",
        selected
    }));

    categories.forEach(category => {
        let selected = false;
        if (selectedCategory === category)
            selected = true;
        select.append($('<option> class="category"', {
            value: category,
            text: category,
            selected
        }));
    });

    $('#searchSelect').on("change", function () {
        let val = $("#searchSelect").find(":selected").val().trim();
        selectedCategory = "";
        if (val !== "all")            
            selectedCategory = val;
    });
}


function filterKeywords() {
    let searchValue = $("#searchBar").val();

    let keywordsTab = searchValue.trim().split(" ");
    if (keywordsTab.length == 0){ //searchValue was empty
        if ("keywords" in filters){ //Check if "keywords" key was in the filters object
            delete filters[keywords];
        }
    }
    let keywords = "";
    keywordsTab.forEach(function(keyword){
        keywords += keyword + ",";
    });
    keywords = keywords.slice(0, -1); //Remove last ','
    filters["keywords"] = keywords;

    //renderPosts(buildQueryString());
}

function filterCategories() {
    filters["category"] = selectedCategory;
}


function buildQueryString(queryString){
    filterKeywords();
    filterCategories();

    queryString += "&sort=category&";
    for (var key in filters){
        if (filters[key] != "")
            queryString += `${key}=${filters[key]}&`;
    }
    queryString = queryString.slice(0, -1); //Remove last '&'
    return queryString;
}