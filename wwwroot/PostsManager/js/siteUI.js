const periodicRefreshPeriod = 10;
let currentETag = "";
let hold_Periodic_Refresh = false;
let contentScrollPosition = 0;
let filters = {};
Init_UI();

function Init_UI() {
    renderPosts();
    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    $('#abort').on("click", async function () {
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });

    start_Periodic_Refresh();
}
function renderAbout() {
    hold_Periodic_Refresh = true;
    saveContentScrollPosition();
    $("#searchContainer").hide();
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
async function renderPosts(queryString = "") {
    hold_Periodic_Refresh = false;
    $("#actionTitle").text("Liste de publications");
    $("#createPost").show();
    $("#searchContainer").show();
    $("#abort").hide();
    // TODO
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
    hold_Periodic_Refresh = true;
    $("#searchContainer").hide();
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreatePostForm() {
    hold_Periodic_Refresh = true;
    $("#searchContainer").hide();
    // TODO
}
async function renderEditPostForm(id) {
    hold_Periodic_Refresh = true;
    $("#searchContainer").hide();
    // TODO
}
async function renderDeletePostForm(id) {
    hold_Periodic_Refresh = true;
    showWaitingGif();
    $("#searchContainer").hide();
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
    hold_Periodic_Refresh = true;
    $("#searchContainer").hide();
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
function renderCategories(categories){
    let select = $('#searchSelect');
    select.empty();
    select.append($('<option>', {
        value: "all",
        text: "Toutes les catégories"
    }));

    categories.forEach(category => {
        select.append($('<option>', {
            value: category,
            text: category
        }));
    });
}

function filterKeywords(searchValue){
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
    filters["keywords"] = keywords;

    renderPosts(buildQueryString());
}
function buildQueryString(){
    let queryString = "?";
    for (var filterKey in filters){
        queryString += `${filterKey}=${filters[filterKey]}&`;
    }
    return queryString;
}

function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!hold_Periodic_Refresh) {
            let etag = await Posts_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                //await pageManager.update(false);
                //compileCategories();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}