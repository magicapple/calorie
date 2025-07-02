# 项目状态与未来计划

本文档总结了当前项目（`calorie`）的最新进展、已完成的任务以及接下来的工作计划，旨在提供清晰的上下文，以便后续协作。

## 已完成的工作

在本次会话中，我们主要完成了以下任务：

1.  **单元测试集成：**
    *   为 `src/utils/calculations.ts` 增加了单元测试，并安装了 Vitest 测试框架。
    *   修复了测试用例中的预期值错误，确保所有测试通过。

2.  **类型定义与模块导入优化：**
    *   将 `FoodItem`、`MealEntry` 和 `PersonalProfileData` 等核心类型定义统一迁移到 `src/types/index.ts`。
    *   确保所有相关组件和工具函数中对这些类型的导入都使用 `import type` 语法，并从 `../types` 路径导入。
    *   在 `src/types/index.ts` 中添加了 `export const __type_exports = {};`，以解决 Vite 在打包纯类型文件时可能出现的运行时导出问题。

3.  **`shadcn/ui` 集成与配置：**
    *   解决了 `shadcn/ui` 初始化和组件导入过程中遇到的各种路径解析问题。
    *   手动创建了 `components.json` 文件，并修正了其中的 `ui` 别名配置，确保 `shadcn/ui` 组件能够正确地生成到 `src/components/ui` 目录下。
    *   在 `vite.config.ts` 中添加了 `resolve.alias` 配置，使 Vite 能够正确解析 `tsconfig.json` 中定义的 `@/` 路径别名。
    *   在根 `tsconfig.json` 中永久添加了 `@/*` 别名配置，以确保项目范围内的模块解析一致性。
    *   成功添加了 `Card` 和 `Button` 组件。

4.  **UI 现代化改造（初步）：**
    *   对 `Dashboard.tsx` 组件进行了初步的 UI 现代化改造，使用了 `shadcn/ui` 的 `Card` 和 `Button` 组件来组织和美化信息展示。

5.  **库存管理功能增强：**
    *   **动态单位克数计算：** 修改了 `PantryBatch` 接口，支持在入库时根据总数量和总重量动态计算每个单位的克数。
    *   **“变质扔掉”功能：** 在 `PantryBatch` 接口中增加了 `spoiledQuantityInUnits` 和 `spoiledWeightInGrams` 字段，并在 `MyPantry.tsx` 中实现了标记变质的逻辑。
    *   **FIFO 消耗逻辑：** 在 `DailyMealLogger.tsx` 中实现了先进先出（FIFO）的库存消耗逻辑，确保食物从最老的批次开始扣除。

6.  **错误与 Linting 修复：**
    *   修复了 `useState` 未定义、`foodDatabase` 未使用等多个编译和 Lint 错误。
    *   解决了 `shadcn/ui` 组件导入路径的各种解析问题。

## 接下来要做的工作

以下是我们将继续进行的工作和改进计划：

1.  **UI 现代化改造（持续）：**
    *   继续对 `PersonalProfile.tsx` 和 `DailyMealLogger.tsx` 组件进行 UI 现代化改造，使其与 `Dashboard.tsx` 的新风格保持一致。
    *   优化表单元素和数据展示，充分利用 `shadcn/ui` 的组件。

2.  **库存管理功能完善：**
    *   **`MyPantry.tsx` 入库界面优化：** 明确区分“按克数入库”和“按单位数量+总重量入库”的输入字段，确保用户能够准确输入数据。
    *   **`DailyMealLogger.tsx` 可用食物显示优化：** 在食物选择器中，除了食物名称，可以考虑显示该食物在库存中的总剩余数量或批次信息，方便用户选择。

3.  **功能扩展（待定）：**
    *   考虑添加一个“食物数据库查看器”组件，允许用户查看、编辑或添加自定义的 `FoodItem` 数据，而不仅仅依赖于预设的 `foodDatabase`。
    *   如果用户有需求，可以进一步探讨如何更精确地估算 DII，但这需要大量的数据和复杂的算法支持。

4.  **代码质量维护：**
    *   持续运行 `npm run lint` 和 `npm test`，确保代码质量和功能稳定性。
    *   如果 `shadcn/ui` 生成的 `react-refresh/only-export-components` 警告持续存在且影响开发体验，可以研究其解决方案（例如，将 `buttonVariants` 移动到单独的文件中）。
