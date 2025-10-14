const visObject = {
    options: {
    },

    create: function (element, config) {
        let css = element.innerHTML = `
            <style>
                .dashboard-directory {
                    font-family: Google Sans, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Naskh Arabic, Noto Sans Thai, Noto Sans Hebrew, Noto Sans Bengali, sans-serif;
                    color: rgb(28, 34, 38);
                    background-color: #ffffff;
                    padding: 20px;
                    max-width: 800px;
                }

                .directory-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: rgb(28, 34, 38);
                    margin-bottom: 20px;
                }

                .main-section {
                    margin-bottom: 20px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .section-header:hover {
                    opacity: 0.9;
                }

                .org-level {
                    background-color: #e3f2fd;
                    color: #1976d2;
                }

                .team-level {
                    background-color: #f3e5f5;
                    color: #7b1fa2;
                }

                .section-icon {
                    margin-right: 8px;
                    font-size: 18px;
                }

                .section-count {
                    margin-left: auto;
                    background-color: rgba(255, 255, 255, 0.8);
                    color: inherit;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: 500;
                }

                .tree-container {
                    margin-left: 0;
                }

                .tree-item {
                    display: flex;
                    align-items: center;
                    padding: 8px 0;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    border-radius: 4px;
                    margin: 2px 0;
                }

                .tree-item:hover {
                    background-color: rgba(0, 0, 0, 0.04);
                }

                .tree-item.current {
                    background-color: rgba(0, 0, 0, 0.08);
                    font-weight: 500;
                }

                .tree-indent {
                    width: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .tree-content {
                    display: flex;
                    align-items: center;
                    flex: 1;
                }

                .tree-arrow {
                    margin-right: 8px;
                    font-size: 14px;
                    color: #666;
                    transition: transform 0.2s;
                }

                .tree-arrow.expanded {
                    transform: rotate(90deg);
                }

                .tree-name {
                    flex: 1;
                    font-size: 14px;
                }

                .tree-count {
                    background-color: #f5f5f5;
                    color: #666;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    margin-left: 8px;
                }

                .tree-link {
                    color: inherit;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    width: 100%;
                }

                .tree-link:hover {
                    text-decoration: none;
                }

                .collapsible {
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }

                .collapsible.collapsed {
                    max-height: 0;
                }

                .collapsible.expanded {
                    max-height: 1000px;
                }
            </style>
        `;
        this._visContainer = element.appendChild(document.createElement("div"));
        this._visContainer.className = "dashboard-directory";
    },

    updateAsync: function (data, element, config, queryResponse, details, doneRendering) {
        this.clearErrors();

        if(queryResponse.fields.dimensions.length < 4) {
            this.addError({title: "Not enough dimensions", message: "This visualization requires 4 dimensions"});
            return;
        }

        this._visContainer.innerHTML = "";

        // Add title
        const title = document.createElement("div");
        title.className = "directory-title";
        title.textContent = "Dashboard Directory";
        this._visContainer.appendChild(title);

        const firstLabel = queryResponse.fields.dimensions[0].name;
        const secondLabel = queryResponse.fields.dimensions[1].name;
        const thirdLabel = queryResponse.fields.dimensions[2].name;
        const fourthLabel = queryResponse.fields.dimensions[3].name;

        let currentDashboardTitle = null;

        if(queryResponse.fields.dimensions.length == 6) {
            const sixthLabel = queryResponse.fields.dimensions[5].name;
            let dashboardData = data.filter(row => row[sixthLabel].value == 1);
            if(dashboardData.length > 0) {
                dashboardData = dashboardData[0];
                if(dashboardData[secondLabel].value != dashboardData[thirdLabel].value) {
                    currentDashboardTitle = dashboardData[fourthLabel].value;
                }
            }
        }

        // Transform data into hierarchical structure
        const transformedData = {};
        const sectionCounts = {};

        data.forEach(row => {
            const firstValue = row[firstLabel].value;
            const secondValue = row[secondLabel].value;
            const thirdValue = row[thirdLabel].value;
            const fourthValue = row[fourthLabel];

            if (!transformedData[firstValue]) {
                transformedData[firstValue] = {};
                sectionCounts[firstValue] = 0;
            }

            if (!transformedData[firstValue][secondValue]) {
                transformedData[firstValue][secondValue] = {};
            }

            if (!transformedData[firstValue][secondValue][thirdValue]) {
                transformedData[firstValue][secondValue][thirdValue] = [];
            }

            transformedData[firstValue][secondValue][thirdValue].push({
                'fourthValue': fourthValue
            });
            sectionCounts[firstValue]++;
        });

        // Analytics function
        const get_analytics_data = (url) => {
            return {
                "type": "events-general",
                "indexType": "client-events",
                "env": "beta",
                "userId": "0",
                "teamId": "0",
                "property": "postman-web",
                "timestamp": new Date().toISOString(),
                "sessionId": "",
                "category": "looker",
                "action": "dashboard-load",
                "meta": {
                    "clickedLink": url,
                    "currentDashboard": currentDashboardTitle,
                }
            }
        }

        // Link creation function
        const get_link = (val) => {
            if (val['links'] && val['links'].length > 0) {
                first_link = val['links'][0];
                url = first_link['url'];
                label = first_link['label'];

                return { url, label };
            }
            return null;
        }

        // Create tree item
        const createTreeItem = (name, count, level, isExpandable = false, isExpanded = false, linkData = null) => {
            const item = document.createElement("div");
            item.className = "tree-item";
            if (level > 0) {
                item.style.marginLeft = `${level * 20}px`;
            }

            const content = document.createElement("div");
            content.className = "tree-content";

            if (isExpandable) {
                const arrow = document.createElement("span");
                arrow.className = `tree-arrow ${isExpanded ? 'expanded' : ''}`;
                arrow.textContent = "▶";
                content.appendChild(arrow);
            } else {
                const spacer = document.createElement("span");
                spacer.style.width = "22px";
                content.appendChild(spacer);
            }

            const nameSpan = document.createElement("span");
            nameSpan.className = "tree-name";
            nameSpan.textContent = name;
            content.appendChild(nameSpan);

            if (count !== undefined) {
                const countSpan = document.createElement("span");
                countSpan.className = "tree-count";
                countSpan.textContent = count;
                content.appendChild(countSpan);
            }

            // Only make it clickable if it's a dashboard link
            if (linkData) {
                const link = document.createElement("a");
                link.className = "tree-link";
                link.href = linkData.url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.title = linkData.label;
                link.appendChild(content);
                item.appendChild(link);

                link.onclick = (e) => {
                    e.preventDefault();
                    fetch("https://events.getpostman-beta.com/events", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        mode: "no-cors",
                        body: btoa(JSON.stringify(get_analytics_data(linkData.url))),
                    });
                    window.open(linkData.url, '_blank');
                };
            } else {
                item.appendChild(content);
                // Add click handler for expandable items
                if (isExpandable) {
                    item.style.cursor = "pointer";
                }
            }

            return item;
        }

        // Create collapsible container
        const createCollapsible = (items, isExpanded = false) => {
            const container = document.createElement("div");
            container.className = `collapsible ${isExpanded ? 'expanded' : 'collapsed'}`;
            items.forEach(item => container.appendChild(item));
            return container;
        }

        // Process each main section
        Object.keys(transformedData).forEach(sectionKey => {
            const sectionData = transformedData[sectionKey];
            const sectionCount = sectionCounts[sectionKey];

            // Create main section
            const sectionDiv = document.createElement("div");
            sectionDiv.className = "main-section";

            // Section header
            const header = document.createElement("div");
            header.className = `section-header ${sectionKey.toLowerCase().includes('org') ? 'org-level' : 'team-level'}`;

            const icon = document.createElement("span");
            icon.className = "section-icon";
            icon.textContent = sectionKey.toLowerCase().includes('org') ? '📊' : '👥';

            const headerText = document.createElement("span");
            headerText.textContent = sectionKey;

            const countBadge = document.createElement("span");
            countBadge.className = "section-count";
            countBadge.textContent = sectionCount;

            header.appendChild(icon);
            header.appendChild(headerText);
            header.appendChild(countBadge);

            // Tree container
            const treeContainer = document.createElement("div");
            treeContainer.className = "tree-container";

            // Process nested data
            let itemCounter = 1;
            Object.keys(sectionData).forEach(secondKey => {
                const secondData = sectionData[secondKey];
                const secondCount = Object.values(secondData).reduce((sum, arr) => sum + arr.length, 0);
                
                const secondItem = createTreeItem(
                    `${itemCounter}. ${secondKey}`,
                    secondCount,
                    0,
                    true,
                    false // Start collapsed
                );

                const secondContainer = createCollapsible([], false); // Start collapsed

                // Process third level
                Object.keys(secondData).forEach(thirdKey => {
                    const thirdData = secondData[thirdKey];
                    const thirdCount = thirdData.length;
                    
                    const thirdItem = createTreeItem(
                        thirdKey,
                        thirdCount,
                        1,
                        true,
                        false // Start collapsed
                    );

                    const thirdContainer = createCollapsible([], false); // Start collapsed

                    // Process fourth level (actual dashboards)
                    thirdData.forEach(row => {
                        const linkData = get_link(row['fourthValue']);
                        const dashboardItem = createTreeItem(
                            row['fourthValue'].value,
                            undefined,
                            2,
                            false,
                            false,
                            linkData
                        );

                        // Highlight current dashboard
                        if (currentDashboardTitle && currentDashboardTitle === row['fourthValue'].value) {
                            dashboardItem.classList.add('current');
                            // Auto-expand to show current dashboard
                            secondContainer.classList.remove('collapsed');
                            secondContainer.classList.add('expanded');
                            secondItem.querySelector('.tree-arrow').classList.add('expanded');
                            thirdContainer.classList.remove('collapsed');
                            thirdContainer.classList.add('expanded');
                            thirdItem.querySelector('.tree-arrow').classList.add('expanded');
                        }

                        thirdContainer.appendChild(dashboardItem);
                    });

                    thirdItem.appendChild(thirdContainer);
                    secondContainer.appendChild(thirdItem);
                });

                secondItem.appendChild(secondContainer);
                treeContainer.appendChild(secondItem);
                itemCounter++;
            });

            sectionDiv.appendChild(header);
            sectionDiv.appendChild(treeContainer);
            this._visContainer.appendChild(sectionDiv);
        });

        // Add click handlers for expand/collapse
        this._visContainer.addEventListener('click', (e) => {
            // Check if clicking on arrow or the tree item itself
            const arrow = e.target.closest('.tree-arrow');
            const treeItem = e.target.closest('.tree-item');
            
            if (arrow || (treeItem && treeItem.style.cursor === 'pointer')) {
                const item = arrow ? arrow.closest('.tree-item') : treeItem;
                const container = item.nextElementSibling;
                
                if (container && container.classList.contains('collapsible')) {
                    const isExpanded = container.classList.contains('expanded');
                    const itemArrow = item.querySelector('.tree-arrow');
                    
                    if (isExpanded) {
                        container.classList.remove('expanded');
                        container.classList.add('collapsed');
                        if (itemArrow) itemArrow.classList.remove('expanded');
                    } else {
                        container.classList.remove('collapsed');
                        container.classList.add('expanded');
                        if (itemArrow) itemArrow.classList.add('expanded');
                    }
                }
            }
        });

        doneRendering();
    }
};

looker.plugins.visualizations.add(visObject);
