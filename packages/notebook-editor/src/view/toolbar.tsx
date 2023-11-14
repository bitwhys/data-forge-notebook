import { Button, ButtonGroup, Icon, Menu, MenuItem, Popover, PopoverInteractionKind, PopoverPosition, Position, Spinner, Tooltip } from '@blueprintjs/core';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import { forceUpdate } from 'browser-utils';
import * as React from 'react';
import { ICommander, ICommanderId } from '../services/commander';
import { IPlatform, IPlatformId } from '../services/platform';
import { INotebookEditorViewModel } from '../view-model/notebook-editor';
import { BUTTON_TOOLTIP_DELAY, makeButton } from './make-button';
import { makeMenuItem } from './make-menu';
import { IZoom, IZoomId } from '../services/zoom';
import { IEvaluatorClient, IEvaluatorId } from '../services/evaluator-client';

const FPSStats = require("react-fps-stats").default;

export interface IToolbarProps {
    model: INotebookEditorViewModel;
}

export interface IToolbarState {
}

@InjectableClass()
export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;
    
    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    @InjectProperty(IZoomId)
    zoom!: IZoom;

    @InjectProperty(IEvaluatorId)
    evaluator!: IEvaluatorClient;

    constructor (props: IToolbarProps) {
        super(props);

        this.state = {};
    }

    componentDidMount() {
        this.props.model.onOpenNotebookWillChange.attach(this.onOpenNotebookWillChange);
        this.props.model.onOpenNotebookChanged.attach(this.onOpenNotebookChanged);
        this.props.model.onModified.attach(this.onNotebookModified);
        
        this.hookNotebookEvents();
    }

    componentWillUnmount(): void {
        this.props.model.onOpenNotebookWillChange.detach(this.onOpenNotebookWillChange);
        this.props.model.onOpenNotebookChanged.detach(this.onOpenNotebookChanged);
        this.props.model.onModified.detach(this.onNotebookModified);

        this.unhookNotebookEvents();
    }

    hookNotebookEvents(): void {
        if (this.props.model.isNotebookOpen()) {
            const notebook = this.props.model.getOpenNotebook();
            notebook.onEvalStarted.attach(this.onCodeEvalStarted);
            notebook.onEvalCompleted.attach(this.onCodeEvalCompleted);
        }
    }

    unhookNotebookEvents(): void {
        if (this.props.model.isNotebookOpen()) {
            const notebook = this.props.model.getOpenNotebook();
            notebook.onEvalStarted.detach(this.onCodeEvalStarted);
            notebook.onEvalCompleted.detach(this.onCodeEvalCompleted);
        }
    }

    private onOpenNotebookWillChange = async (): Promise<void> => {
        this.unhookNotebookEvents();
    }

    private onOpenNotebookChanged = async (): Promise<void> => {
        this.hookNotebookEvents();
    }

    private onCodeEvalStarted = async () => {
        await forceUpdate(this);
    }

    private onCodeEvalCompleted = async () => {
        await forceUpdate(this);
    }

    private onNotebookModified = async () => {
        await forceUpdate(this);
    }

    render(): JSX.Element {
        const isNotebookOpen = this.props.model.isNotebookOpen();
        const notebook = this.props.model.isNotebookOpen() && this.props.model.getOpenNotebook() || undefined;
        let language = notebook && notebook.getLanguage();
        if (language === "javascript") {
            language = "JavaScript";
        }
        else if (language === "typescript") {
            language = "TypeScript";
        }

        return (
            <div 
                style={{
                    paddingTop: "8px",
                    paddingBottom: "6px",
                    backgroundColor: "#FAFAFA",
                    borderBottom: "1px solid #DEDEDE",
                }}
                >
                <div 
                    className="flex flex-row items-center centered-container"
                    >

                    {isNotebookOpen
                        && <ButtonGroup>
                            {makeButton(this.commander, "eval-notebook", 
                                { 
                                    pos: Position.BOTTOM,
                                }, 
                                this.platform,
                                { 
                                    notebook
                                }, 
                                this.evaluator.isWorking() ? "executing" : "notExecuting"
                            )}
                        </ButtonGroup>
                    }

                    <ButtonGroup className="ml-2">
                        {makeButton(this.commander, "new-notebook", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "open-notebook", { pos: Position.BOTTOM }, this.platform)}
                        {isNotebookOpen &&
                            makeButton(this.commander, "reload-notebook", { pos: Position.BOTTOM }, this.platform)
                        }
                        {isNotebookOpen
                            && makeButton(this.commander, "save-notebook", { pos: Position.BOTTOM }, this.platform)
                        }
                    </ButtonGroup>
                    
                    {this.props.model.isNotebookOpen()
                        && <ButtonGroup className="ml-2">
                            {makeButton(this.commander, "undo", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "redo", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    {this.props.model.isNotebookOpen()
                        && <Popover
                            className="ml-2"
                            autoFocus={false}
                            usePortal={false}
                            position={PopoverPosition.BOTTOM}
                            content={
                                <Menu>
                                    <MenuItem text="Insert above">
                                        {makeMenuItem(this.commander, "insert-code-cell-above", this.platform, { notebook })}
                                        {makeMenuItem(this.commander, "insert-markdown-cell-above", this.platform, { notebook })}
                                    </MenuItem>
                                    <MenuItem text="Insert below">
                                        {makeMenuItem(this.commander, "insert-code-cell-below", this.platform, { notebook })}
                                        {makeMenuItem(this.commander, "insert-markdown-cell-below", this.platform, { notebook })}
                                    </MenuItem>
                                </Menu>
                            } 
                            >
                            <Button
                                icon="plus"
                                small
                                minimal
                                />
                        </Popover>
                    }

                    <ButtonGroup className="ml-2">
                        {makeButton(this.commander, "toggle-hotkeys", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "toggle-recent-file-picker", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "toggle-examples-browser", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "toggle-command-palette", { pos: Position.BOTTOM }, this.platform)}
                    </ButtonGroup>

                    {this.props.model.isNotebookOpen()
                        &&<ButtonGroup className="ml-2">
                            {makeButton(this.commander, "clear-outputs", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    <ButtonGroup className="ml-2">
                        <Tooltip
                            content="Resets the zoom level to default"
                            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
                            >
                            <Button
                                small
                                minimal
                                icon="zoom-to-fit"
                                onClick={() => this.zoom.resetZoom()}
                                >
                            </Button>
                        </Tooltip>
                        <Tooltip
                            content="Zooms out to see more of your notebook"
                            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
                            >
                            <Button
                                className="ml-1"
                                small
                                minimal
                                icon="zoom-out"
                                onClick={() => this.zoom.zoomOut()}
                                >
                            </Button>
                        </Tooltip>
                        <Tooltip
                            content="Zooms in your notebook to make the test and graphics larger"
                            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
                            >
                            <Button
                                small
                                minimal
                                icon="zoom-in"
                                onClick={() => this.zoom.zoomIn()}
                                >
                            </Button>
                        </Tooltip>
                    </ButtonGroup>

                    {this.props.model.isNotebookOpen()
                        &&<ButtonGroup className="ml-2">
                            {makeButton(this.commander, "split-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "merge-cell-up", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "merge-cell-down", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "duplicate-cell", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    {this.props.model.isNotebookOpen()
                        &&<ButtonGroup className="ml-2">
                            {makeButton(this.commander, "focus-top-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "focus-prev-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "focus-next-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "focus-bottom-cell", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }
                    
                    <span className="flex-grow ml-2" />

                    {language 
                        && <div
                            className="flex flex-row items-center ml-2"
                            style={{
                                fontSize: "0.8em"
                            }}
                            >
                            {language}
                        </div>
                    }

                    <div 
                        className="flex flex-row items-center justify-center ml-3"
                        >
                        <Popover
                            autoFocus={false}
                            interactionKind={PopoverInteractionKind.HOVER}
                            hoverOpenDelay={50}
                            hoverCloseDelay={1000}
                            usePortal={false}
                            position={PopoverPosition.BOTTOM_RIGHT}
                            content={(
                                <div
                                    style={{
                                        padding: "5px",
                                    }}
                                    >
                                    {this.evaluator.getCurrentJobName()}
                                </div>
                            )}
                            >
                            <div
                                style={{
                                    outline: "none",
                                    cursor: "pointer",
                                    paddingTop: "2.5px",
                                    width: "20px",
                                    height: "20px",
                                }}
                                >
                                {this.evaluator.isWorking()
                                    && <Spinner
                                        size={15}
                                        />
                                    || <div
                                        className="flex flex-col items-center justify-center"
                                        style ={{
                                            marginTop: "4px",
                                        }}
                                        >
                                        <Icon icon="link" />
                                    </div>
                                }
                            </div>
                        </Popover>
                    </div>
                    
                    <FPSStats 
                        top="auto"
                        left="auto"
                        right={0}
                        bottom={0}
                        />

                </div>

            </div>
        )
    }
}

