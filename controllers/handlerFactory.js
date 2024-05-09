const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    // Using findOneAndDelete with a query object to specify the document ID
    const doc = await Model.findOneAndDelete({ _id: req.params.id });
    if (!doc) {
        return next(new AppError('No document found with this ID', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});


exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    
    if (!doc) {
        return next(new AppError('No document found with this ID', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)
    res.status(201).json({
        status: 'success',
        data: {
            doc: newDoc
        }
    });
})

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findOne({ _id: req.params.id })
    if (popOptions) query = query.populate(popOptions);
    const doc = await query

    if (!doc) {
        return next(new AppError('No document found with this ID', 404))
    }
    res.status(200).json({
        status: 'success',
        data: doc
    })
})
exports.getAll = Model => catchAsync(async (req, res, next) => {
    
    const doc = await Model.find(req.query)
    res.status(200).json({
        status: 'success',
        requistedAt: req.requestTime,
        result: doc.length,
        data: doc
    })
})