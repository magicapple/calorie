# 常见问题调试指南

本文档总结了在 `calorie` 项目开发过程中遇到的一些常见问题及其解决方案，旨在帮助团队成员更高效地进行调试，避免重复犯错。

## 1. `Uncaught SyntaxError: The requested module '...' does not provide an export named '...'`

**问题描述：**
浏览器控制台或 Vite 命令行报错，提示某个模块没有提供预期的导出。例如：
*   `... does not provide an export named 'FoodItem' (at foodDatabase.ts:1:10)`
*   `... does not provide an export named 'MealEntry' (at calculations.ts:2:10)`
*   `... does not provide an export named 'PersonalProfileData' (at Dashboard.tsx:2:10)`

**根本原因：**
这通常发生在 TypeScript 类型定义文件（`.ts` 或 `.tsx`）被导入，但 Vite 在打包时将其视为纯类型文件并进行了优化（即移除了所有运行时代码），导致运行时找不到任何导出。或者，导入路径不正确，导致无法找到正确的导出。

**解决方案：**
1.  **统一类型定义文件：** 将所有共享的接口、类型定义集中到一个或少数几个纯 `.ts` 文件中（例如 `src/types/index.ts`）。
2.  **使用 `import type`：** 在所有导入类型的地方，明确使用 `import type { TypeName } from '...';` 语法。这会告诉 TypeScript 编译器和打包工具，这是一个纯类型导入，不会产生运行时代码。
3.  **确保类型文件有运行时导出（可选但推荐）：** 如果上述方法仍然出现问题，可以在纯类型定义文件中添加一个空的运行时导出，以防止打包工具过度优化。例如，在 `src/types/index.ts` 的末尾添加：
    ```typescript
    export const __type_exports = {};
    ```
    这会强制打包工具将该文件视为一个包含运行时代码的模块，从而保留其导出。

## 2. `Failed to resolve import '...' from '...'` 或 `Does the file exist?`

**问题描述：**
Vite 命令行或浏览器控制台报错，提示无法解析导入路径，或者文件不存在。例如：
*   `Failed to resolve import "./ui/card" from "src/components/Dashboard.tsx".`
*   `Failed to resolve import "src/lib/utils" from "src/components/ui/button.tsx".`

**根本原因：**
这通常是由于以下一个或多个原因造成的：
*   **文件或目录确实不存在：** `shadcn/ui` 组件未正确安装或放置在预期位置。
*   **导入路径不正确：** 相对路径计算错误，或者使用了别名但别名未被正确配置或解析。
*   **Vite 别名配置缺失：** Vite 没有被告知如何解析 `tsconfig.json` 中定义的路径别名。

**解决方案：**

1.  **确保 `shadcn/ui` 组件已正确安装和放置：**
    *   确认 `src/components/ui` 目录存在。如果不存在，手动创建：`mkdir -p src/components/ui`。
    *   确保 `components.json` 文件存在于项目根目录，并且其 `aliases.ui` 配置指向正确的路径（例如 `"src/components/ui"`）。
    *   如果 `shadcn` 组件未正确生成，尝试使用 `npx shadcn@latest add <component-name> --overwrite` 重新添加组件。
    *   **重要：** 如果 `shadcn` 的 `init` 或 `add` 命令行为异常（例如提示创建 `components.json` 但未创建，或组件放置在错误位置），可能需要：
        *   删除项目根目录下的 `components.json`。
        *   **临时修改根 `tsconfig.json`**，将 `tsconfig.app.json` 中的 `compilerOptions.paths` 复制到根 `tsconfig.json` 中。
        *   运行 `npx shadcn@latest init -y`。
        *   **手动创建/修改 `components.json`**，确保 `aliases.ui` 指向 `src/components/ui`。
        *   运行 `npx shadcn@latest add card --overwrite` 和 `npx shadcn@latest add button --overwrite`。
        *   **恢复根 `tsconfig.json`** 到原始状态（移除临时添加的 `compilerOptions`）。

2.  **统一导入路径使用 `@` 别名：**
    *   在所有组件和文件中，对于项目内部的模块导入，优先使用 `@/` 别名。例如，将 `import { cn } from "src/lib/utils";` 改为 `import { cn } from "@/lib/utils";`。
    *   确保 `Dashboard.tsx` 中 `shadcn/ui` 组件的导入路径是 `@/components/ui/card` 和 `@/components/ui/button`。

3.  **配置 Vite 解析 `tsconfig.json` 别名：**
    *   在 `vite.config.ts` 中，确保 `resolve.alias` 配置正确，将 `@` 别名映射到 `src` 目录。
    *   示例 `vite.config.ts` 片段：
        ```typescript
        import { defineConfig } from 'vite';
        import react from '@vitejs/plugin-react';
        import tailwindcss from '@tailwindcss/vite';
        import { VitePWA } from 'vite-plugin-pwa';
        import path from 'path'; // 确保导入 path 模块

        export default defineConfig({
          plugins: [
            react(),
            tailwindcss(),
            VitePWA({ /* ... */ }),
          ],
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
        });
        ```

4.  **确保根 `tsconfig.json` 包含 `paths` 配置：**
    *   即使 `tsconfig.app.json` 中有 `paths` 配置，Vite 和其他工具可能只读取根 `tsconfig.json`。因此，确保根 `tsconfig.json` 包含以下配置：
        ```json
        {
          "compilerOptions": {
            "baseUrl": ".",
            "paths": {
              "@/*": [
                "./src/*"
              ]
            }
          },
          "files": [],
          "references": [
            { "path": "./tsconfig.app.json" },
            { "path": "./tsconfig.node.json" }
          ]
        }
        ```

## 3. `Uncaught ReferenceError: useState is not defined`

**问题描述：**
浏览器控制台报错，提示 `useState` 或 `useEffect` 等 React Hook 未定义。

**根本原因：**
React Hooks（如 `useState`, `useEffect`）必须从 `react` 包中导入。

**解决方案：**
确保在使用 React Hooks 的文件中，顶部有正确的导入语句：
```typescript
import React, { useState, useEffect } from "react";
```

## 4. Linting 错误 (`'...' is defined but never used`)

**问题描述：**
运行 `npm run lint` 时，提示某个变量或导入被定义但从未被使用。

**根本原因：**
代码中存在未使用的变量或导入，这会影响代码质量和可维护性。

**解决方案：**
*   如果变量或导入确实不需要，请将其删除。
*   如果导入的是类型，请使用 `import type` 语法，例如 `import type { FoodItem } from '../types';`。
*   如果变量是间接使用的（例如 `foodDatabase` 通过 `pantry` 间接影响组件行为），但 ESLint 无法识别，可以考虑在导入语句前添加 `// eslint-disable-next-line @typescript-eslint/no-unused-vars` 来禁用该行的 lint 检查，但应谨慎使用。

--- 

**总结：**

这次调试过程暴露了在集成 `shadcn/ui` 和配置 Vite/TypeScript 项目时可能遇到的常见陷阱。关键在于：
*   **理解模块解析机制：** 明确 Vite 如何解析导入路径，以及 `tsconfig.json` 中的 `paths` 和 `vite.config.ts` 中的 `resolve.alias` 如何协同工作。
*   **区分运行时代码和类型：** 正确使用 `import type` 来处理纯类型导入，避免打包工具的过度优化。
*   **系统性检查：** 当遇到问题时，从错误信息出发，系统性地检查所有相关的配置文件和代码文件，而不是盲目尝试。
