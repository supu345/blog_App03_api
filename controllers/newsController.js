const { formidable } = require("formidable");
const cloudinary = require("cloudinary").v2;
const newsModel = require("../models/newsModel");
const authModel = require("../models/authModel");
const galleryModel = require("../models/galleryModel");
const {
  mongo: { ObjectId },
} = require("mongoose");
const moment = require("moment");

class newsController {
  add_news = async (req, res) => {
    const { id, category, name } = req.userInfo;
    const form = formidable({});
    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true,
    });
    try {
      const [fields, files] = await form.parse(req);
      const { url } = await cloudinary.uploader.upload(
        files.image[0].filepath,
        { folder: "news_images" }
      );
      const { title, description } = fields;
      const news = await newsModel.create({
        writerId: id,
        title: title[0].trim(),
        slug: title[0].trim().split(" ").join("-"),
        category,
        description: description[0],
        date: moment().format("LL"),
        writerName: name,
        image: url,
      });
      return res.status(201).json({ message: "news add success", news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  update_news = async (req, res) => {
    const { news_id } = req.params;
    const form = formidable({});

    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true,
    });

    try {
      const [fields, files] = await form.parse(req);
      const { title, description } = fields;
      let url = fields.old_image[0];

      if (Object.keys(files).length > 0) {
        const spliteImage = url.split("/");
        const imagesFile = spliteImage[spliteImage.length - 1].split(".")[0];
        await cloudinary.uploader.destroy(imagesFile);
        const data = await cloudinary.uploader.upload(
          files.new_image[0].filepath,
          { folder: "news_images" }
        );
        url = data.url;
      }

      const news = await newsModel.findByIdAndUpdate(
        news_id,
        {
          title: title[0].trim(),
          slug: title[0].trim().split(" ").join("-"),
          description: description[0],
          image: url,
        },
        { new: true }
      );

      return res.status(200).json({ message: "news update success", news });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  update_news_update = async (req, res) => {
    const { role } = req.userInfo;
    const { news_id } = req.params;
    const { status } = req.body;

    if (role === "admin") {
      const news = await newsModel.findByIdAndUpdate(
        news_id,
        { status },
        { new: true }
      );
      return res
        .status(200)
        .json({ message: "news status update success", news });
    } else {
      return res.status(401).json({ message: "You cannot access this api" });
    }
  };

  get_images = async (req, res) => {
    const { id } = req.userInfo;

    try {
      const images = await galleryModel
        .find({ writerId: new ObjectId(id) })
        .sort({ createdAt: -1 });
      return res.status(201).json({ images });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_recent_news = async (req, res) => {
    try {
      const news = await newsModel
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .skip(6)
        .limit(6);
      return res.status(201).json({ news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_category_news = async (req, res) => {
    const { category } = req.params;

    try {
      const news = await newsModel.find({
        $and: [
          {
            category: {
              $eq: category,
            },
          },
          {
            status: {
              $eq: "active",
            },
          },
        ],
      });
      return res.status(201).json({ news });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  news_search = async (req, res) => {
    const { value } = req.query;

    try {
      //console.log("Search value:", value);
      const news = await newsModel.find({
        status: "active",
        $text: {
          $search: value,
        },
      });

      if (!news.length) {
        return res.status(200).json({ news: [], message: "No results found." });
      }

      return res.status(200).json({ news });
    } catch (error) {
      console.error("Error:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  add_images = async (req, res) => {
    const form = formidable({});
    const { id } = req.userInfo;

    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true,
    });

    try {
      const [_, files] = await form.parse(req);
      let allImages = [];
      const { images } = files;

      for (let i = 0; i < images.length; i++) {
        const { url } = await cloudinary.uploader.upload(images[i].filepath, {
          folder: "news_images",
        });
        allImages.push({ writerId: id, url });
      }

      const image = await galleryModel.insertMany(allImages);
      return res
        .status(201)
        .json({ images: image, message: "images uplaod success" });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_dashboard_news = async (req, res) => {
    const { id, role } = req.userInfo;
    try {
      if (role === "admin") {
        const news = await newsModel.find({}).sort({ createdAt: -1 });
        return res.status(200).json({ news });
      } else {
        const news = await newsModel
          .find({ writerId: new ObjectId(id) })
          .sort({ createdAt: -1 });
        return res.status(200).json({ news });
      }
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_dashboard_single_news = async (req, res) => {
    const { news_id } = req.params;
    try {
      const news = await newsModel.findById(news_id);
      return res.status(200).json({ news });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // website

  get_all_news = async (req, res) => {
    try {
      const category_news = await newsModel.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $match: {
            status: "active",
          },
        },
        {
          $group: {
            _id: "$category",
            news: {
              $push: {
                _id: "$_id",
                title: "$title",
                slug: "$slug",
                writerName: "$writerName",
                image: "$image",
                description: "$description",
                date: "$date",
                category: "$category",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            news: {
              $slice: ["$news", 5],
            },
          },
        },
      ]);

      const news = {};
      for (let i = 0; i < category_news.length; i++) {
        news[category_news[i].category] = category_news[i].news;
      }
      return res.status(200).json({ news });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_news = async (req, res) => {
    const { slug } = req.params;

    try {
      const news = await newsModel.findOneAndUpdate(
        { slug },
        {
          $inc: { count: 1 },
        },
        { new: true }
      );

      const relateNews = await newsModel
        .find({
          $and: [
            {
              slug: {
                $ne: slug,
              },
            },
            {
              category: {
                $eq: news.category,
              },
            },
          ],
        })
        .limit(4)
        .sort({ createdAt: -1 });

      return res.status(200).json({ news: news ? news : {}, relateNews });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_news_category = async (req, res) => {
    try {
      const category = req.params.category; // Get category from URL parameters
      const filter = category ? { category } : {}; // Build filter object

      // Define collation options for case-insensitive matching
      const collationOptions = { locale: "en", strength: 2 };

      // Fetch news articles with collation for case-insensitive matching
      const news = await newsModel
        .find(filter)
        .collation(collationOptions)
        .sort({ createdAt: -1 })
        .exec();

      res.status(200).json({ news });
      // console.log("Fetched news:", news);
    } catch (error) {
      console.error("Error fetching news by category:", error.message);
      res.status(500).json({ message: "Error fetching news", error });
    }
  };
  get_news_categorys = async (req, res) => {
    try {
      const { category } = req.params; // Get category from URL parameters
      const { page = 1, limit = 5 } = req.query; // Get pagination parameters from query

      // Validate pagination parameters
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
      if (
        isNaN(pageNumber) ||
        pageNumber <= 0 ||
        isNaN(pageSize) ||
        pageSize <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Invalid pagination parameters" });
      }

      // Build filter object for category
      const filter = category ? { category } : {};

      // Define collation options for case-insensitive matching
      const collationOptions = { locale: "en", strength: 2 };

      // Fetch news articles with collation for case-insensitive matching and pagination
      const news = await newsModel
        .find(filter)
        .collation(collationOptions)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .exec();

      // Fetch total count of news articles for pagination metadata
      const totalCount = await newsModel
        .countDocuments(filter)
        .collation(collationOptions)
        .exec();

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / pageSize);

      res.status(200).json({
        news,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          pageSize,
        },
      });
      // console.log("Fetched news:", news);
    } catch (error) {
      console.error("Error fetching news by category:", error.message);
      res.status(500).json({ message: "Error fetching news", error });
    }
  };

  //created by me

  category_article_get = async (req, res) => {
    let { currentPage, category } = req.query;

    currentPage = parseInt(currentPage);
    const parPage = 2;
    const skipPage = parseInt(currentPage - 1) * parPage;

    try {
      const countArticle = await newsModel
        .find({ category: category })
        .countDocuments();
      const articles = await newsModel
        .find({ category: category })
        .skip(skipPage)
        .limit(parPage)
        .sort({ createAt: -1 });
      return res.status(200).json({
        categoryArticle: articles,
        parPage,
        countCateArticle: countArticle,
      });
    } catch (error) {
      return res.status(500).json({
        errorMessage: {
          error: "Internal server error",
        },
      });
    }
  };

  get_categories = async (req, res) => {
    try {
      const categories = await newsModel.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
      ]);
      return res.status(200).json({ categories });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_popular_news = async (req, res) => {
    //console.log("asdsa");
    try {
      const popularNews = await newsModel
        .find({ status: "active" })
        .sort({ count: -1 })
        .limit(4);
      return res.status(200).json({ popularNews });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  get_latest_news = async (req, res) => {
    try {
      const news = await newsModel
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(19);

      return res.status(200).json({ news });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  get_images = async (req, res) => {
    //console.log("okkasd");
    try {
      const images = await newsModel.aggregate([
        {
          $match: {
            status: "active",
          },
        },
        {
          $sample: {
            size: 9,
          },
        },
        {
          $project: {
            image: 1,
          },
        },
      ]);
      console.log(images);
      return res.status(200).json({ images });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
module.exports = new newsController();
