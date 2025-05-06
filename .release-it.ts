import { Config } from "release-it";

export default {
  hooks: {
    "after:bump": "npm run build",
  },
  plugins: {
    "@release-it/conventional-changelog": {
      preset: { name: "angular" },
      infile: false,
    },
  },
  git: {
    requireBranch: "main",
  },
  github: {
    release: true,
    assets: ["dist/binaries/*.tar.gz", "dist/binaries/*.zip"],
  }
} satisfies Config;
