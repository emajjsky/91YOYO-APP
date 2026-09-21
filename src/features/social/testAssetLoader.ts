type AssetModule = { exports: unknown };
type AssetRequire = typeof require & {
  extensions: Record<string, (module: AssetModule) => void>;
};

const extensions = (require as AssetRequire).extensions;
let nextAssetId = 1;

for (const extension of ['.jpg', '.mp4', '.wav']) {
  extensions[extension] = (module) => {
    module.exports = nextAssetId;
    nextAssetId += 1;
  };
}
