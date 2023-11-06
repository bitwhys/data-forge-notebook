import * as React from 'react';
import { deepCompare } from 'host-bridge';
import ApexCharts from 'apexcharts';

export interface IPlotProps {
    //
    // Configuration and data for the plot to be displayed.
    //
    data?: any;
}

export class Plot extends React.Component<IPlotProps, {}> {

    containerElement: React.RefObject<HTMLDivElement>;

    chart?: ApexCharts;

    constructor (props: IPlotProps) {
        super(props);

        this.state = {
            useApex: true,
        };
        
        this.containerElement = React.createRef();
    }

    async componentDidMount(): Promise<void> {
        await this.generateChart();
    }

    componentDidUpdate(prevProps: IPlotProps) {
        if (!deepCompare(this.props.data, prevProps.data)) {
            this.generateChart();
        }
    }


    componentWillUnmount() {
        this.destroyChart();
    }
    
    private async generateChart(): Promise<void> {

        this.destroyChart();

        let data = this.props.data;

        if (!data) {
            // No chart data to render.
            return;
        }

        if (Array.isArray(data)) {
            //
            // Transform the data.
            //
            if (data.length === 0) {
                // Nothing to render.
                return;
            }

            if (Array.isArray(data[0])) {
                //
                // Data looks like a table, an array of rows.
                //
                const columnNames = data.shift();
                data = {
                    series: columnNames.map((columnName: string, columnIndex: number) => {
                        return {
                            name: columnName,
                            data: data.map((row: any[]) => row[columnIndex]),
                        };
                    }),
                };
            }
            else if (typeof data[0] === "object") {
                //
                // Data looks like an array of objects.
                //
                const columnNames = Object.keys(data[0]);
                data = {
                    series: columnNames.map((columnName: string) => {
                        return {
                            name: columnName,
                            data: data.map((row: any) => row[columnName]),
                        };
                    }),
                };
            }
            else {
                //
                // Just assume an array of primitives (eg numbers).
                //
                data = {
                    series: [{
                        data: data,
                    }],
                };
            }
        }

        if (data.chart === undefined) {
            // Default.
            data.chart = {};
        }

        if (data.chart.height === undefined) {
            // Default to height of container.
            data.chart.height = "100%";
        }

        if (data.chart.type === undefined) {
            // Default to line charts.
            data.chart.type = "line";
        }

        try {
            this.chart = new ApexCharts(this.containerElement.current!, data);
            this.chart.render();
        }
        catch (err: any) {
            console.error("Failed to render chart.");
            console.error(err && err.stack || err);
        }
    }

    private destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = undefined;
        }
    }   
    
    render () {
        // Apex Charts has two container divs because it modifies the style of both!
        return (
            <div
                style={{
                    height: "100%",
                    paddingRight: "5px",
                }}
                >
                <div ref={this.containerElement} />
            </div>
        );

    }
};