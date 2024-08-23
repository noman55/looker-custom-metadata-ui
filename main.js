const visObject = {
    options: {},

    create: function (element, config) {
        let css = element.innerHTML = `
            <style>
                .dashboard-details-vis {
                    font-family: Google Sans, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Naskh Arabic, Noto Sans Thai, Noto Sans Hebrew, Noto Sans Bengali, sans-serif;
                    color: rgb(28, 34, 38);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 20px;
                    gap: 15px;
                    background-color: #f5f5f5;
                    border-radius: 10px;
                    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
                }

                .status-box {
                    background-color: rgba(0, 0, 0, 0.2);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    text-align: center;
                    margin-bottom: 10px;
                    width: 200px;
                }

                .dashboard-description {
                    font-size: 1.2rem;
                    text-align: center;
                    margin-bottom: 15px;
                }

                .widget-container {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    gap: 15px;
                }

                .widget {
                    flex: 1;
                    background-color: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }

                .widget-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 1rem;
                }

                .widget-value {
                    font-size: 1.5rem;
                    color: rgb(28, 34, 38);
                }
            </style>
        `;
        this._visContainer = element.appendChild(document.createElement("div"));
        this._visContainer.className = "dashboard-details-vis";
    },

    updateAsync: function (data, element, config, queryResponse, details, doneRendering) {

        this.clearErrors();

        if(queryResponse.fields.dimensions.length < 6) {
            this.addError({title: "Not enough dimensions", message: "This visualization requires 6 dimensions"});
            return;
        }

        this._visContainer.innerHTML = "";

        // Extract dimension names
        const statusLabel = queryResponse.fields.dimensions[0].name;
        const descriptionLabel = queryResponse.fields.dimensions[1].name;
        const dataOwnerLabel = queryResponse.fields.dimensions[2].name;
        const businessOwnerLabel = queryResponse.fields.dimensions[3].name;
        const userVisitsLabel = queryResponse.fields.dimensions[4].name;

        // Extract data
        const statusValue = data[0][statusLabel].value;
        const descriptionValue = data[0][descriptionLabel].value;
        const dataOwnerValue = data[0][dataOwnerLabel].value;
        const businessOwnerValue = data[0][businessOwnerLabel].value;
        const userVisitsValue = data[0][userVisitsLabel].value;

        // Create status box
        const statusBox = document.createElement("div");
        statusBox.className = "status-box";
        statusBox.innerText = statusValue === 'production' ? 'Production' : 'Non-Production';
        this._visContainer.appendChild(statusBox);

        // Create dashboard description
        const dashboardDescription = document.createElement("div");
        dashboardDescription.className = "dashboard-description";
        dashboardDescription.innerText = descriptionValue;
        this._visContainer.appendChild(dashboardDescription);

        // Create widget container
        const widgetContainer = document.createElement("div");
        widgetContainer.className = "widget-container";

        // Data Owner Widget
        const dataOwnerWidget = document.createElement("div");
        dataOwnerWidget.className = "widget";
        dataOwnerWidget.innerHTML = `
            <div class="widget-title">Data Owner</div>
            <div class="widget-value">${dataOwnerValue}</div>
        `;
        widgetContainer.appendChild(dataOwnerWidget);

        // Business Owner Widget
        const businessOwnerWidget = document.createElement("div");
        businessOwnerWidget.className = "widget";
        businessOwnerWidget.innerHTML = `
            <div class="widget-title">Business Owner</div>
            <div class="widget-value">${businessOwnerValue}</div>
        `;
        widgetContainer.appendChild(businessOwnerWidget);

        // User Visits Widget
        const userVisitsWidget = document.createElement("div");
        userVisitsWidget.className = "widget";
        userVisitsWidget.innerHTML = `
            <div class="widget-title">User Visits (Last 90 Days)</div>
            <div class="widget-value">${userVisitsValue}</div>
        `;
        widgetContainer.appendChild(userVisitsWidget);

        // Append widget container to main container
        this._visContainer.appendChild(widgetContainer);

        doneRendering();
    }
};

looker.plugins.visualizations.add(visObject);