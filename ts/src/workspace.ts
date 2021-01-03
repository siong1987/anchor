import camelCase from "camelcase";
import { Program } from './program';

let _populatedWorkspace = false;

// Workspace program discovery only works for node environments.
export default new Proxy({} as any, {
    get(
      workspaceCache: { [key: string]: Program },
      programName: string
    ) {
      const find = require('find');
      const fs = require('fs');
      const process = require('process');

      if (typeof window !== 'undefined') {
        throw new Error(
          '`anchor.workspace` is not available in the browser'
        );
      }

      if (!_populatedWorkspace) {
        const path = require('path');

        let projectRoot = process.cwd();
        while (!fs.existsSync(path.join(projectRoot, 'Anchor.toml'))) {
          const parentDir = path.dirname(projectRoot);
          if (parentDir === projectRoot) {
            projectRoot = undefined;
          }
          projectRoot = parentDir;
        }


        if (projectRoot === undefined) {
          throw new Error(
            'Could not find workspace root. Perhaps set the `OASIS_WORKSPACE` env var?'
          );
        }

        find
          .fileSync(/target\/idl\/.*\.json/, projectRoot)
          .reduce((programs: any, path: string) => {
            const idlStr = fs.readFileSync(path);
            const idl = JSON.parse(idlStr);
						const name = camelCase(idl.name, { pascalCase: true });
            programs[name] = new Program(idl, idl.metadata.address);
            return programs;
          }, workspaceCache);

        _populatedWorkspace = true;
      }

      return workspaceCache[programName];
    },
  }
);