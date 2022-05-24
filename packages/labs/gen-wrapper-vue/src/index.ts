/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import * as path from 'path';
import {
  getLitModules,
  LitModule,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {packageJsonTemplate} from './lib/package-json-template.js';
import {tsconfigTemplate} from './lib/tsconfig-template.js';
// import {wrapperModuleTemplate} from './lib/wrapper-module-template.js';
import {wrapperModuleTemplateSFC} from './lib/wrapper-module-template-sfc.js';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {tsconfigNodeTemplate} from './lib/tsconfig.node-template.js';
import {viteConfigTemplate} from './lib/vite.config-template.js';

export const generateVueWrapper = async (
  analysis: Package
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(analysis);
  if (litModules.length > 0) {
    // Base the generated package folder name off the analyzed package folder
    // name, not the npm package name, since that might have an npm org in it
    const vuePkgName = packageNameToVuePackageName(
      path.basename(analysis.rootDir)
    );
    return {
      [vuePkgName]: {
        '.gitignore': gitIgnoreTemplate(litModules),
        'package.json': packageJsonTemplate(analysis.packageJson, litModules),
        'tsconfig.json': tsconfigTemplate(),
        'tsconfig.node.json': tsconfigNodeTemplate(),
        'vite.config.ts': viteConfigTemplate(analysis.packageJson, litModules),
        ...wrapperSFCFiles(analysis.packageJson, litModules),
      },
    };
  } else {
    throw new Error('No Lit components were found in this package.');
  }
};

// TODO(kschaaf): Should this be configurable?
const packageNameToVuePackageName = (pkgName: string) => `${pkgName}-vue`;

const gitIgnoreTemplate = (litModules: LitModule[]) => {
  return litModules.map(({module}) => module.jsPath).join('\n');
};

// const wrapperFiles = (packageJson: PackageJson, litModules: LitModule[]) => {
//   const wrapperFiles: FileTree = {};
//   for (const {
//     module: {sourcePath, jsPath},
//     elements,
//   } of litModules) {
//     wrapperFiles[sourcePath] = wrapperModuleTemplate(
//       packageJson,
//       jsPath,
//       elements
//     );
//   }
//   return wrapperFiles;
// };

const getVueFileName = (dir: string, name: string) =>
  path.resolve(dir, `${name}.vue`);

const wrapperSFCFiles = (packageJson: PackageJson, litModules: LitModule[]) => {
  const wrapperFiles: FileTree = {};
  for (const {
    module: {sourcePath, jsPath},
    elements,
  } of litModules) {
    // Format: [...[name, content]]
    const wrappers = wrapperModuleTemplateSFC(packageJson, jsPath, elements);
    const dir = path.dirname(sourcePath);
    if (wrappers.length > 1) {
      // TODO(sorvell): Throw if components names are re-used in the same folder.
      const modules: FileTree = {};
      const exports: string[] = [];
      for (const [name, content] of wrappers) {
        exports.push(`export {default as ${name}} from './${name}.vue';`);
        modules[getVueFileName(dir, name)] = content!;
      }
      wrapperFiles[sourcePath] = exports.join('/n');
      Object.assign(wrapperFiles, modules);
    } else {
      const [name, content] = wrappers[0];
      wrapperFiles[getVueFileName(dir, name)] = content;
    }
  }
  return wrapperFiles;
};