import * as React from "react";
import { InjectableClass } from "@codecapers/fusion";
import { asyncHandler } from "utils";
import { forceUpdate } from "browser-utils";
import { INotebookEditorViewModel } from "../../view-model/notebook-editor";
import { NotebookUI } from "./notebook";
import { Toolbar } from "../toolbar";

export interface INotebookEditorProps {
    model: INotebookEditorViewModel;
}

export interface INotebookEditorState {
    //
    // Set to true to display settings.
    //
    isSettingsOpen: boolean;

    //
    // Records the initial tab to display in the settings dialog.
    //
    initialSettingsTab?: string;
}

@InjectableClass()
export class NotebookEditor extends React.Component<INotebookEditorProps, INotebookEditorState> {

    constructor (props: any) {
        super(props);

        this.state = {
            isSettingsOpen: false,
        };

        this.componentDidMount = asyncHandler(this, this.componentDidMount);
        this.onOpenNotebookChanged = asyncHandler(this, this.onOpenNotebookChanged);
    }

    private async onOpenNotebookChanged(isReload: boolean): Promise<void> {
        await forceUpdate(this);

        if (!isReload) {
            document.documentElement.scrollTop = 0;
        }
    }

    async componentDidMount() {
        this.props.model.onOpenNotebookChanged.attach(this.onOpenNotebookChanged);

        this.props.model.mount();
    }

    componentWillUnmount(): void {
        this.props.model.onOpenNotebookChanged.detach(this.onOpenNotebookChanged);

        this.props.model.unmount();
    }

    render () {
        return (
            <div 
                className="pos-relative border" 
                >
                <div>
                    <div
                        style={{ 
                            position: "sticky", 
                            left: 0, 
                            right: 0, 
                            top: 0,
                            zIndex: 2000,
                        }}
                        >
                        <Toolbar 
                            model={this.props.model} 
                            />
                    </div>

                    <div 
                        className="flex flex-col"
                        style={{ 
                            marginTop: "4px",
                        }}
                        >
                        {this.props.model.isNotebookOpen()
                            ? <NotebookUI
                                key={this.props.model.getOpenNotebook().getInstanceId()}
                                model={this.props.model.getOpenNotebook()} 
                                />
                            : <div>Notebook not loaded {/*todo have a button here to load the notebook? or not?*/} </div>
                        }
                        
                    </div>
                </div>
            </div>
        );
    }
}