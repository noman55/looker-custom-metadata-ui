const visObject = {
    options: {
    },

    create: function (element, config) {
        let css = element.innerHTML = `
            <style>
                .dashboard-details-vis {
                    font-family: Google Sans, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Naskh Arabic, Noto Sans Thai, Noto Sans Hebrew, Noto Sans Bengali, sans-serif;
                    color: rgb(28, 34, 38);
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-around;
                    align-items: stretch;
                    gap:15px;
                }

                li {
                    display: flex;
                }

                li:hover, summary:hover {
                    background-color: rgb(234, 235, 235);
                }

                a {
                    color: inherit;
                    margin-left: 12px;
                    display: list-item;
                    width: 100%;
                }

                .category-card {
                    padding-left: 12px;
                    padding-right: 10px;
                    flex: 1 1 0px;
                    background-color: #ffffff;
                    border-color: rgb(38, 48, 51);
                    border-radius: 6px;
                    border-bottom-width: 0px;
                    border-left-width: 0px;
                    border-right-width: 0px;
                    box-shadow: rgba(0, 0, 0, 0.11) 0px 2px 12px, rgba(0, 0, 0, 0.04) 0px 1px 4px;
                    padding-bottom: 10px;
                }

                .category-card-title {
                    text-align: center;
                    font-weight: 500;
                    line-height: 2;
                    color: rgb(38, 48, 51);
                    font-size: 1.3rem;
                }
            </style>
        `;
        this._visContainer = element.appendChild(document.createElement("div"));
        this._visContainer.className = "dashboard-details-vis";
    },

    updateAsync: function (data, element, config, queryResponse, details, doneRendering) {

        this.clearErrors();

        if(queryResponse.fields.dimensions.length < 4) {
            this.addError({title: "Not enough dimensions", message: "This visualization requires 4 dimensions"});
            return;
        }

        this._visContainer.innerHTML = "";
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

        const transformedData = {}
        const onlySummary = {}

        data.forEach(row => {
            const firstValue = row[firstLabel].value;
            const secondValue = row[secondLabel].value;
            const thirdValue = row[thirdLabel].value;
            const fourthValue = row[fourthLabel];

            if (!transformedData[firstValue]) {
                transformedData[firstValue] = {};
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
        });

        for (const key in transformedData) {
            if (transformedData.hasOwnProperty(key)) {
                const secondValues = Object.keys(transformedData[key]);
                if (secondValues.length > 1) {
                    onlySummary[key] = false;
                }
                else {
                    onlySummary[key] = true;
                }
            }
        }

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

        const get_link = (val) => {
            if (val['links'] && val['links'].length > 0) {
                first_link = val['links'][0];
                url = first_link['url'];
                label = first_link['label'];

                const anchorEle = document.createElement("a");
                anchorEle.href = url;
                anchorEle.target = "_blank";
                anchorEle.rel = "noopener noreferrer";
                anchorEle.title = label;

                anchorEle.innerText = val['value'];
                anchorEle.onclick = (e) => {
                    e.preventDefault();
                    fetch("https://events.getpostman-beta.com/events", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        mode: "no-cors",
                        body: btoa(JSON.stringify(get_analytics_data(url))),
                    });
                }

                return [anchorEle, label];
            }
        }

        for (const key in transformedData) {

            const flexDiv = document.createElement("div");
            flexDiv.setAttribute('class', 'category-card');

            const flexDivTitle = document.createElement("div");
            flexDivTitle.setAttribute('class', 'category-card-title');
            flexDivTitle.innerText = key;
            flexDiv.appendChild(flexDivTitle);

            if (onlySummary[key]) {
                const summaryValue = Object.keys(transformedData[key])[0];
                const thirdLevelKeys = Object.keys(transformedData[key][summaryValue]);
                
                if (thirdLevelKeys.length === 1) {
                    // Only one header, show links directly
                    const headerKey = thirdLevelKeys[0];
                    transformedData[key][summaryValue][headerKey].forEach(row => {
                        const liElement = document.createElement("li");
                        const [value, label] = get_link(row['fourthValue']);
                        liElement.appendChild(value);
                        liElement.title = label;
                        flexDiv.appendChild(liElement);
                    });
                } else {
                    // Multiple headers, create expandable sections
                    for (const headerKey of thirdLevelKeys) {
                        const flexDetails = document.createElement("details");
                        const flexSummary = document.createElement("summary");
                        flexSummary.setAttribute("style", "list-style:None;");
                        flexSummary.innerText = headerKey;
                        flexDetails.appendChild(flexSummary);

                        const flexSummaryDiv = document.createElement("div");
                        transformedData[key][summaryValue][headerKey].forEach(row => {
                            const liElement = document.createElement("li");
                            const [value, label] = get_link(row['fourthValue']);
                            liElement.appendChild(value);
                            liElement.title = label;
                            flexSummaryDiv.appendChild(liElement);

                            if(currentDashboardTitle && currentDashboardTitle == row['fourthValue'].value) {
                                flexDetails.setAttribute("open", "");
                                liElement.setAttribute("style", "background-color: rgb(234, 235, 235);");
                            }
                        });
                        flexDetails.appendChild(flexSummaryDiv);
                        flexDiv.appendChild(flexDetails);
                    }
                }
            }
            else {
                for (const nestedKey in transformedData[key]) {
                    const flexDetails = document.createElement("details");
                    const flexSummary = document.createElement("summary");
                    flexSummary.setAttribute("style", "list-style:None;");
                    flexSummary.innerText = nestedKey;
                    flexDetails.appendChild(flexSummary);

                    const flexSummaryDiv = document.createElement("div");
                    const thirdLevelKeys = Object.keys(transformedData[key][nestedKey]);
                    
                    for (const headerKey of thirdLevelKeys) {
                        const headerDetails = document.createElement("details");
                        const headerSummary = document.createElement("summary");
                        headerSummary.setAttribute("style", "list-style:None; margin-left: 10px;");
                        headerSummary.innerText = headerKey;
                        headerDetails.appendChild(headerSummary);

                        const headerDiv = document.createElement("div");
                        transformedData[key][nestedKey][headerKey].forEach(row => {
                            const liElement = document.createElement("li");
                            const [value, label] = get_link(row['fourthValue']);
                            liElement.appendChild(value);
                            liElement.title = label;
                            headerDiv.appendChild(liElement);

                            if(currentDashboardTitle && currentDashboardTitle == row['fourthValue'].value) {
                                flexDetails.setAttribute("open", "");
                                headerDetails.setAttribute("open", "");
                                liElement.setAttribute("style", "background-color: rgb(234, 235, 235);");
                            }
                        });
                        headerDetails.appendChild(headerDiv);
                        flexSummaryDiv.appendChild(headerDetails);
                    }
                    flexDetails.appendChild(flexSummaryDiv);
                    flexDiv.appendChild(flexDetails);
                }
            }
            this._visContainer.appendChild(flexDiv);
        }

        doneRendering();
    }
};

looker.plugins.visualizations.add(visObject);