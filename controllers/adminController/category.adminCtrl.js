const Category = require('../../models/adminModel/category.adminModel');

exports.createCategory = async (req, res) => {
    try {
        const { name, description, prices, status } = req.body;
        if (!name || !prices) {
            return res.status(400).json({
                success: true,
                message: 'name and prices are required',
            });
        };
        const category = new Category({
            name, description, prices, status,
        });

        await category.save();
        res.status(201).json({
            success: true,
            message: 'Category created successfully...',
            category,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                errors: messages,
            });
        } else if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Category already exists!',
            });
        };
        console.log(error);
        res.status(500).json({
            success: true,
            message: "error occured during creating the category",
        });
    };
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json({
            success: true,
            message: "All categories fetched successfully...",
            categories,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: true,
            message: "error occured during fetching the category",
        });
    };
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, prices: { monthly, quarterly, yearly }, } = req.body;

        const categoryId = req.params.categoryId;
        const updates = req.body;

        if (!categoryId || !name || !monthly || !quarterly || !yearly) {
            return res.status(400).json({
                success: false,
                message: "categoryId, name and prices are required",
            });
        };
        const category = await Category.findByIdAndUpdate(
            categoryId,
            { ...updates, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: true,
                message: "category not found",
            });
        };
        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully...",
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: true,
            message: "error occured during update the category",
        });
    };
};

exports.deleteCategories = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        if (!categoryId) {
            return res.status(400).json({
                success: true,
                message: "categoryId is required"
            });
        };
        const category = await Category.findByIdAndDelete(categoryId);

        if (!category) {
            return res.status(404).json({
                success: true,
                message: "category not found",
            });
        };

        res.status(200).json({
            success: true,
            message: "category deleted successfully...",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: true,
            message: "error occured while during the category",
        });
    };
};