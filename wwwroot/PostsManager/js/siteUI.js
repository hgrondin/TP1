import {Posts_API} from './API_Posts.js';
const periodicRefreshPeriod = 10;
let hold_Periodic_Refresh = false;
let contentScrollPosition = 0;
let pageManager;
let currentETag = "";
let filters = {};
let selectedCategory = "";
let lastQueryString = "";

let postsSeeMore = [];

let waiting = null;
let waitingGifTrigger = 2000;
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        $("#itemsPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

setAllCategories();

Init_UI();

async function Init_UI() {
    filterCategories();
    filterKeywords("Test lolo");

    let itemLayout = {
        width: $("#sample").outerWidth(), //La longueur extérieur de l'élément
        height: $("#sample").outerHeight() //La hauteur extérieur de l'élément
    };

    pageManager = new PageManager('scrollPanel', 'itemsPanel', itemLayout, renderPosts);

    showPosts();
    $("#postForm").hide();
    $("#aboutContainer").hide();
    $("#searchIcon").on("click", async function() {
        pageManager.update(false, true);
    });
    $("#searchBar").on("keydown", async function(ev) {
        if (ev.key === 'Enter'){
            pageManager.update(false, true);
        }
    });

    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    
    $('#abort').on("click", async function () {
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    start_Periodic_Refresh();
}

function renderAbout() {
    hold_Periodic_Refresh = true;
    saveContentScrollPosition();
    hidePosts();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
}


function showPosts() {
    $("#createPost").show();
    $("#abort").hide();  
    $("#scrollPanel").show();
    $("#postForm").hide();
    $("#content").show();
    $("#searchContainer").show();
    hold_Periodic_Refresh = false;
}
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function hidePosts(){
    $("#content").hide();
}
function hidePostForm(){
    $("#postForm").hide();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    hold_Periodic_Refresh = true;
    hidePosts();
    hidePostForm();
    $("#errorContainer").show();
    $("#errorContainer").append($(`<div>${message}</div>`));
}

async function renderPosts(queryString, isSearch) {
    let endOfData = false;

    if (isSearch) {
        lastQueryString = buildQueryString(queryString);
        queryString += lastQueryString;
    } else {
        if (lastQueryString === "") {
            lastQueryString += "&sort=Creation,desc";
            queryString += "&sort=Creation,desc";
        } else
            queryString += lastQueryString;
    }
    addWaitingGif();

    let response = await Posts_API.GetQuery(queryString);

    if (!Posts_API.error) { //S'il n'y a pas d'erreur, on peut continuer

        /*TO DO: Faire la gesiton avec le Etag (voir appUI.cs du projet Bookmarks2)*/
        //currentETag = response.ETag;
        let posts = response.data;
        if (posts.length > 0) {
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

                let showSeeMore = false;
                if (postsSeeMore.indexOf(post.Id) !== -1) {
                    showSeeMore = true;
                }

                $("#itemsPanel").append(renderPost(post, text, wordsLengthMore, "", "", showSeeMore));

                if (wordsLengthMore) {
                    $(".seeMoreDescriptionPost").on("click", function() {
                        let id = $(this).attr("seeMore");
                        $('[completeDescription="'+id+'"]').show();
                        $('[descriptionPostId="'+id+'"]').hide();
                        $(this).hide();

                        let index = postsSeeMore.indexOf(id);
                        if (index !== -1)
                            postsSeeMore.splice(index, 1);
                        postsSeeMore.push(id);

                        let parent = $(this).parent();
                        let showLess = parent.children('.seeLessDescriptionPost');
                        showLess.show();
                    });
                }

                $(".seeLessDescriptionPost").on("click", function() {
                    let id = $(this).attr("seeLess");
                    const index = postsSeeMore.indexOf(id);
                    if (index > -1) {
                        postsSeeMore.splice(index, 1); //remove from array
                    }
                    let parent = $(this).parent();
                    let seeMoreBtn = parent.children('.seeMoreDescriptionPost');
                    seeMoreBtn.show();
                    $(this).hide();
                    $('[completeDescription="'+id+'"]').hide();
                    $('[descriptionPostId="'+id+'"]').show();
                });
            });

            $(".editCmd").off();
            $(".editCmd").on("click", function () {
                renderEditPostForm($(this).attr("editPostId"));
            });
            $(".deleteCmd").off();
            $(".deleteCmd").on("click", function () {
                renderDeletePostForm($(this).attr("deletePostId"));
            });

        } else {
            endOfData = true;

            $("#itemsPanel").append(renderPost(null, "", false, filters["keywords"], filters["category"]));
        }
    } else {
        renderError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    
    
    return endOfData;
}

function renderPost(post, textDescription, wordsLengthMore, valueSearchBar = "", valueCategory = "", showSeeMore = false) {
    if (post !== null) {
        let elementsWordsLengthMore;

        if (wordsLengthMore) {
            if (!showSeeMore) {
            elementsWordsLengthMore = `<p class="descriptionPost text" completeDescription="${post.Id}" style="display: none">
                                            ${post.Text.replaceAll("\r\n", "<br>")}                 
                                        </p>
                                        <p class="descriptionPost text" descriptionPostId="${post.Id}">
                                            ${textDescription}...
                                        </p>
                                        <p class="seeMoreDescriptionPost seeMore" seeMore="${post.Id}">Voir plus</p>
                                        <p class="seeLessDescriptionPost seeLess" seeLess="${post.Id}" style="display: none">Voir moins</p>
                                        `;
            } else {
                elementsWordsLengthMore = `<p class="descriptionPost text" completeDescription="${post.Id}">
                                            ${post.Text.replaceAll("\r\n", "<br>")}                 
                                            </p>
                                            <p class="descriptionPost text" descriptionPostId="${post.Id}" style="display: none">
                                                ${textDescription}...
                                            </p>
                                            <p class="seeMoreDescriptionPost seeMore" seeMore="${post.Id}" style="display: none">Voir plus</p>
                                            <p class="seeLessDescriptionPost seeLess" seeLess="${post.Id}">Voir moins</p>
                                            `;
            }
        } else {
            elementsWordsLengthMore = `<p class="descriptionPost text">
                                            ${textDescription}                 
                                        </p>`;
        }

        return $(`
        <div class="postContainer" id="${post.Id}">
            <div class="globalTopInformationsContainer">
                <div class="topInformationsContainer">
                    <p class="categoryPost text">${post.Category.toUpperCase()}</p>
                    <div class="titlePostContainer text">
                        <p>${post.Title.toUpperCase()}</p>
                    </div>
                </div>
                <div class="iconsContainer">
                    <span class="cmdIcon fa fa-edit editCmd" title="Modifier la publication" editPostId="${post.Id}"></span>
                    <span class="cmdIcon fa fa-trash deleteCmd" title="Supprimer la publication" deletePostId="${post.Id}"></span>
                </div>
            </div>
            <div class="imageAndDateContainer">
                <!--Image temporaire-->
                <div class="imagePost" style="background-image:url('${post.Image}')"></div>

            </div>
            <div>
                <p class="dateLastModificationPost text">${convertToFrenchDate(post.Creation)}</p>
            </div>
            <div>
                ${elementsWordsLengthMore}                
                <!--<p class="descriptionPost text">Le ministre de l’Immigration, Jean-François Roberge, a déposé ce matin son plan annuel d’immigration.</p>-->
            </div>
        </div>
        `);
    } else {
        if (valueSearchBar !== "") {
            valueSearchBar = valueSearchBar.replaceAll(",", " ");

            let category = valueCategory;

            if (category === "")
                category = "Toutes les catégories"
            return $(`
                <div class="textNoPostPoundContainer">
                    <span class="text textNoPostPound_BoldPart">Aucun résulat</span>
                    <span class="text textNoPostPound">trouvé pour les valeurs:</span>
                    <span class="text textNoPostPound_FilterInfosPart"> "${valueSearchBar}" </span>
                    <span class="text textNoPostPound"> et la catégorie:</span>
                    <span class="text textNoPostPound_FilterInfosPart"> "${category}"</span>
                    <span class="text textNoPostPound">.</span>
                </div>
            `);
        }
    }
}


function renderCreatePostForm() {
    renderPostForm();
}
async function renderEditPostForm(id) {
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        if (Post !== null)
            renderPostForm(Post);
        else
            renderError("Post introuvable!");
    } else {
        renderError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    addWaitingGif();
    hold_Periodic_Refresh = true;
    $("#createPost").hide();
    $("#searchContainer").hide();
    $("#content").hide();
    $("#abort").show();
    $("#postForm").show();
    $("#postForm").empty();

    let res = await Posts_API.Get(id);
    if (!Posts_API.error){
        let post = res.data;
        if (post !== null) {
            post.Text = post.Text.replaceAll("\r\n", "<br>");
            $("#postForm").append(`
                <h2 id="actionTitle" class="text">Effacer cette publciation?</h2>
                <div class="scrollPost">
                    <div class="scrollPostV2">
                            <input type="hidden" name="Id" value="${post.Id}"/>

                            <div class="titlePostContainer" style="text-align: center !important;">${post.Title}</div>
                            
                            <div class="deletePostImageContainer">
                                <div class="imagePost" style="background-image:url('${post.Image}')"></div>
                            </div>
                            
                            <div class="descriptionPostDeleteForm text">
                                ${post.Text}
                            </div>
                            
                            <hr>
                            <div class="addModifyPost">
                            <input type="submit" value="Supprimer" id="deletePost" class="btn btn-primary">
                            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
                            </div>
                    </div>
                </div> 
            `);
            $('#deletePost').on("click", async function () {
                showWaitingGif();
                let result = await Posts_API.Delete(post.Id);
                if (result)
                    showPosts();
                else
                    renderError("Une erreur est survenue!");
            });
            $('#cancel').on("click", function () {
                showPosts();
            });
        }
        else {
            renderError("Publication introuvable!");
        }
    }
    else{
        renderError(Posts_API.currentHttpError);
    }
}
function renderPostForm(post = null) {
    hold_Periodic_Refresh = true;
    $("#createPost").hide();
    $("#searchContainer").hide();
    $("#content").hide();
    $("#abort").show();
    let create = post == null;
    if (create) {
        post = newPost();
        post.Image = "images/no-image.jpg";
    }
    
    $("#postForm").show();
    $("#postForm").empty();
    $("#postForm").append(`
        <h2 id="actionTitle" class="text">${create ? "Création d'une publication" : "Modification d'une publication"}</h4>
        <div class="scrollPost">
        <div class="scrollPostV2">
        <form class="form" id="thePostForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
            <input type="hidden" name="Creation" value=""/>

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
                class="form-control Text textAreaDescriptionPost"
                name="Text"
                id="Text"
                placeholder="Contenu de la publication"
                required
                RequireMessage="Veuillez entrer le contenu de la publication"                 
            >${post.Text}</textarea>
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
            <div class="addModifyPost">
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
            </div>
        </form>
        </div>
        </div>
    `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    $('#thePostForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#thePostForm"));
        post["Creation"] = new Date().getTime();
        addWaitingGif();
        let result = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            showPosts();
            await pageManager.update(false);
            pageManager.scrollToElem(post.Id); //To go at the element in the scroll view        
        }
        else
            renderError("Une erreur est survenue! ");
    });
    $('#cancel').on("click", function () {
        showPosts();
    });
}

function newPost() {
    let Post = {};
    Post.Id = 0;
    Post.Title = "";
    Post.Text = "";
    Post.Category = "";
    return Post;
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
}

function filterCategories() {
    filters["category"] = selectedCategory;
}


function buildQueryString(){
    filterKeywords();
    filterCategories();

    let queryString = "&sort=Creation,desc&";
    for (var key in filters){
        if (filters[key] != "")
            queryString += `${key}=${filters[key]}&`;
    }
    queryString = queryString.slice(0, -1); //Remove last '&'
    return queryString;
}


function convertToFrenchDate(numeric_date) {
    let date = new Date(numeric_date);
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    var opt_weekday = { weekday: 'long' };
    var weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
    return weekday + " le " + date.toLocaleDateString("fr-FR", options) + " - " + date.toLocaleTimeString("fr-FR");
}

function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!hold_Periodic_Refresh) {
            let etag = await Posts_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                await pageManager.update(false);
                setAllCategories();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}