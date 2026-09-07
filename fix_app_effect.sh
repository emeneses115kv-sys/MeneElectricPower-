sed -i 's/        if (cloudData) {/        const customComps = await getCustomComponents();\n        setCustomComponents(customComps);\n\n        if (cloudData) {/g' src/App.tsx
