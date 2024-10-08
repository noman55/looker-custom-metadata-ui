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
                    align-items: flex-start; /* Aligns content to the left */
                    justify-content: flex-start;
                    padding: 20px;
                    gap: 15px;
                    border-radius: 10px;
                }

                .status-box {
                    padding: 3px 8px; /* Reduced padding for Non-Production */
                    border-radius: 5px;
                    text-align: center;
                    width: auto;
                    margin-bottom: 10px;
                    border: 2px solid; /* Added border for visual indication */
                    font-size: 11px; /* Reduced font size */
                    text-transform: uppercase; /* Make text ALL CAPS */
                    align-items: center;
                    gap: 2px;
                }

                .status-production {
                    color: green; /* Green text for Production */
                    border-color: green; /* Green border for Production */
                    background-color: transparent; /* No background change */
                }

                .status-nonproduction {
                    color: #8E1A10; /* Red text for Non-Production */
                    border-color: #F79A8E; /* Red border for Non-Production */
                    background-color: transparent; /* No background change */
                }

                .status-personal {
                    border-color: #E6E6E6; /* Gray border for personal */
                    color: #6B6B6B; /* Gray text color */
                    align-items: center;
                    display: flex;
                }

                .warning-box {
                    background-color: #FFF9E0; /* Transparent background */
                    border-color: #FFF9E0; /* Orange border for warnings */
                    font-size: 12px; /* Text size 12px */
                    color: #212121; /* Dark text color */
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                    width: 100%;
                    display: flex; /* Added flex display for alignment */
                    align-items: center;
                    gap: 5px;
                }

                .dashboard-description {
                    line-height: 20px; /* Increased line height for better readability */
                    font-size: 12px;
                    text-align: left; /* Align description text to the left */
                    margin-bottom: 15px;
                    color: rgb(28, 34, 38);
                    font-family: Google Sans, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Naskh Arabic, Noto Sans Thai, Noto Sans Hebrew, Noto Sans Bengali, sans-serif;
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
                    font-size: 12px;
                }

                .widget-value {
                    font-size: 12px;
                    color: rgb(28, 34, 38);
                }
                .person-icon {
                    width: 16px;
                    height: 16px;
                    margin-right: 5px; /* Add margin to separate icon from text */
                    color: #6B6B6B; /* Gray color for personal icon */
                }
            </style>
        `;
        this._visContainer = element.appendChild(document.createElement("div"));
        this._visContainer.className = "dashboard-details-vis";
    },

    updateAsync: function (data, element, config, queryResponse, details, doneRendering) {

        this.clearErrors();

        if (queryResponse.fields.dimensions.length < 6) {  // Updated the check to 6 dimensions
            this.addError({title: "Not enough dimensions", message: "This visualization requires 6 dimensions"});
            return;
        }

        this._visContainer.innerHTML = "";

        // Extract dimension names
        const statusLabel = queryResponse.fields.dimensions[0].name;
        const warningLabel = queryResponse.fields.dimensions[1].name;
        const descriptionLabel = queryResponse.fields.dimensions[2].name;  // New dimension for the warning text
        const dataOwnerLabel = queryResponse.fields.dimensions[3].name;
        const businessOwnerLabel = queryResponse.fields.dimensions[4].name;
        const userVisitsLabel = queryResponse.fields.dimensions[5].name;

        // Extract data
        const statusValue = data[0][statusLabel].value;
        const descriptionValue = data[0][descriptionLabel].value;
        const warningValue = data[0][warningLabel].value;  // Extract the warning text

        const dataOwnerValue = data[0][dataOwnerLabel].value;
        const businessOwnerValue = data[0][businessOwnerLabel].value;
        const userVisitsValue = data[0][userVisitsLabel].value;

        // Create status box
        const statusBox = document.createElement("div");
        statusBox.className = "status-box " + (
            statusValue === 'production' ? 'status-production' :
            statusValue === 'nonproduction' ? 'status-nonproduction' : 'status-personal'
        );
        statusBox.innerHTML = statusValue === 'production' ? 'Production' :
                              statusValue === 'nonproduction' ? 'Non-Production' : `
                              <svg class="person-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                              </svg> Personal`;
        this._visContainer.appendChild(statusBox);

        // Create warning info panel
        const warningBox = document.createElement("div");
        warningBox.className = "warning-box";
        // Add the warning icon using SVG and text to the warning box
        warningBox.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="orange" viewBox="0 0 24 24" width="16px" height="16px">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M1 21h22L12 2 1 21zM12 16h-1v-1h1v1zm0-2h-1v-4h1v4z"/>
            </svg>
            <span>${warningValue} For metrics accuracy, please refer to <a href="https://postman.looker.com/looks/4485" target="_blank">go-to dashboards</a>.</span>
        `;
        this._visContainer.appendChild(warningBox);

        // Create dashboard description only if it is not empty
        if (descriptionValue) {
            const dashboardDescription = document.createElement("div");
            dashboardDescription.className = "dashboard-description";
            dashboardDescription.innerText = descriptionValue;
            this._visContainer.appendChild(dashboardDescription);
        }

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
