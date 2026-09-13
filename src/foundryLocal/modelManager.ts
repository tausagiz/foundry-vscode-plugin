import * as vscode from 'vscode';
import type { FoundryLocalManager } from 'foundry-local-sdk' with { "resolution-mode": "import" };
import type { IModel } from 'foundry-local-sdk' with { "resolution-mode": "import" };

export type ModelSummary = {
  alias: string;
  id: string;
  cached: boolean;
  loaded: boolean;
  capabilities: string | null;
};

export class ModelManager {
  private manager?: FoundryLocalManager;
  private currentModel?: IModel;
  private initialization?: Promise<FoundryLocalManager>;

  async listModels(): Promise<ModelSummary[]> {
    const manager = await this.getManager();
    const models = await manager.catalog.getModels();
    return Promise.all(models.map(async model => ({
      alias: model.alias,
      id: model.id,
      cached: model.isCached,
      loaded: await model.isLoaded(),
      capabilities: model.capabilities
    })));
  }

  async ensureLoaded(
    alias: string,
    token: vscode.CancellationToken
  ): Promise<IModel> {
    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }

    if (this.currentModel?.alias === alias && await this.currentModel.isLoaded()) {
      return this.currentModel;
    }

    if (this.currentModel) {
      await this.currentModel.unload();
      this.currentModel = undefined;
    }

    const manager = await this.getManager();
    const model = await manager.catalog.getModel(alias);
    if (!model.isCached) {
      const autoDownload = vscode.workspace
        .getConfiguration('foundryLocal')
        .get<boolean>('autoDownload', true);
      if (!autoDownload) {
        throw new Error(`Model '${model.alias}' is not in the SDK cache. Enable foundryLocal.autoDownload or download it first.`);
      }
      await model.download();
    }

    if (token.isCancellationRequested) {
      throw new vscode.CancellationError();
    }

    await model.load();
    this.currentModel = model;
    return model;
  }

  async dispose(): Promise<void> {
    if (this.currentModel) {
      await this.currentModel.unload();
      this.currentModel = undefined;
    }
  }

  private async getManager(): Promise<FoundryLocalManager> {
    if (this.manager) {
      return this.manager;
    }

    this.initialization ??= import('foundry-local-sdk').then(sdk =>
      sdk.FoundryLocalManager.createAsync({
        appName: 'foundry-local-copilot',
        logLevel: 'error'
      })
    );
    this.manager = await this.initialization;
    return this.manager;
  }
}