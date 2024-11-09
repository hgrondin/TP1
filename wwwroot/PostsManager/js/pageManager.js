class PageManager {
    // getItemsCallBack must return true when there is no more data to collect
    constructor(scrollPanelId, itemsPanelId, itemLayout, getItemsCallBack) {
        this.scrollPanel = $(`#${scrollPanelId}`);
        this.itemsPanel = $(`#${itemsPanelId}`);
        this.itemLayout = itemLayout;
        this.currentPage = { limit: -1, offset: -1 };
        this.resizeTimer = null;
        this.resizeEndTriggerDelai = 300;
        this.getItems = getItemsCallBack;
        this.installViewportReziseEvent();
        this.reset();
    }

    //La méthode reset() permet de reset des valeurs.
    reset() {
        this.resetScrollPosition();
        this.update(false);
    }
    installViewportReziseEvent() {
        let instance = this;
        $(window).on('resize', function (e) {
            clearTimeout(instance.resizeTimer);
            instance.resizeTimer = setTimeout(() => { instance.update(false); }, instance.resizeEndTriggerDelai);
        });
    }
    //La méthode setCurrentPageLimit() permet d'attribuer la limite du nombre d'élément pour l'élément scrollPanel (l'élément comprenant le div qui comprend tout les posts).
    setCurrentPageLimit() {
        let nbColumns = Math.trunc(this.scrollPanel.innerWidth() / this.itemLayout.width); //Pour obtenir le nombre de colonnes.
        if (nbColumns < 1) nbColumns = 1; //Par défaut le nombre de colonne est 1.
        let nbRows = Math.round(this.scrollPanel.innerHeight() / this.itemLayout.height); //Pour obtenir le nombre de rangées
        this.currentPage.limit = nbRows * nbColumns + nbColumns /* make sure to always have a content overflow */; //Pourquoi nous avons besoin d'un overflow: The overflow property sets or returns what to do with content that renders outside the element box.
    }

    //La méthode currentPageToQueryString() permet de retourner la query string
    currentPageToQueryString(append = false) {
        this.setCurrentPageLimit(); //On attribue la valeur de la limite de la page.
        let limit = this.currentPage.limit; 
        let offset = this.currentPage.offset;
        if (!append) {
            limit = limit * (offset + 1);
            offset = 0;
        }
        return `?limit=${limit}&offset=${offset}`;
    }

    scrollToElem(elemId) {
        let itemToReach = $("#" + elemId);
        if (itemToReach) {
            let itemsContainer = itemToReach.parent();
            this.scrollPanel.animate({
                scrollTop: itemToReach.offset().top - itemsContainer.offset().top
            }, 500);
        }
    }
    scrollPosition() {
        return this.scrollPanel.scrollTop();
    }
    storeScrollPosition() {
        this.scrollPanel.off(); //La méthode off() supprime les gestionnaires d'événements qui ont été attachés avec .on().
        this.previousScrollPosition = this.scrollPosition(); //Retourne la position du scrollTop().
    }

    //Permet de reset les paramètres de la scroll view rattachés à la position de cette dernière.
    resetScrollPosition() {
        this.currentPage.offset = 0; //On met la position dans le scroll view à 0.
        this.scrollPanel.off(); //Pour supprimer les événements attachés à l'élément en question, grâce à la méthode on() méthode.
        this.scrollPanel.scrollTop(0); //On set la position dans la scroll view (notre position visuelle) à 0.
    }

    
    restoreScrollPosition() {
        this.scrollPanel.off();
        this.scrollPanel.scrollTop(this.previousScrollPosition);
    }

    //La méthode update() permet de gérer le contenu du scroll view.
    async update(append = true, isSearch = false) {
        this.storeScrollPosition();
        if (!append) this.itemsPanel.empty(); //Si on ajoute pas, on supprime tous les éléments enfant de l'élément relié à la variable itemsPanel.
        let endOfData = await this.getItems(this.currentPageToQueryString(append), isSearch); //On va chercher les données selon une queryString.
        this.restoreScrollPosition();
        let instance = this;
        this.scrollPanel.scroll(function () {
            if (!endOfData && (instance.scrollPanel.scrollTop() + instance.scrollPanel.outerHeight() >= instance.itemsPanel.outerHeight() - instance.itemLayout.height / 2)) {
                instance.scrollPanel.off();
                instance.currentPage.offset++;
                instance.update(true);
            }
            //console.log(`scroll`,instance.scrollPanel.scrollTop())
        });
    }
}