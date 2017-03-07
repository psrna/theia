import {ContainerModule} from "inversify";
import {EditorOpenerService} from "./editor-opener";
import {TheiaPlugin, IOpenerService} from "../../application/browser";

export const editorModule = new ContainerModule(bind => {
    bind(EditorOpenerService).toSelf().inSingletonScope();
    bind(TheiaPlugin).toDynamicValue(context => context.container.get(EditorOpenerService));
    bind(IOpenerService).toDynamicValue(context => context.container.get(EditorOpenerService));
});