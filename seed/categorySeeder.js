const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Category = require('../models/Category')

dotenv.config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log('MongoDB connected...')
    } catch (error) {
        console.error('Database connection failed:', error.message)
        process.exit(1)
    }
}

const seedCategories = async () => {
    try {
        await Category.deleteMany()
        console.log('Existing categories deleted.')

        // Root categories
        const electronics = await new Category({ name: 'Electronics', description: 'Devices and gadgets' }).save()
        const clothing = await new Category({ name: 'Clothing', description: 'Apparel for men and women' }).save()
        const homeAppliances = await new Category({ name: 'Home Appliances', description: 'Kitchen and home devices' }).save()
        const books = await new Category({ name: 'Books', description: 'Fiction, non-fiction, and more' }).save()
        const toys = await new Category({ name: 'Toys', description: 'Toys for all ages' }).save()
        const sports = await new Category({ name: 'Sports & Outdoors', description: 'Equipment and gear for activities' }).save()

        // Subcategories for Electronics
        await new Category({ name: 'Smartphones', description: 'All types of smartphones', parentCategory: electronics._id }).save()
        const laptops = await new Category({ name: 'Laptops', description: 'Personal and gaming laptops', parentCategory: electronics._id }).save()
        const gamingConsoles = await new Category({ name: 'Gaming Consoles', description: 'All kind of gaming consoles', parentCategory: electronics._id }).save()
        await new Category({ name: 'Accessories', description: 'Gadgets and accessories', parentCategory: electronics._id }).save()
        await new Category({ name: 'Cameras', description: 'Photography and video equipment', parentCategory: electronics._id }).save()
        await new Category({ name: 'Wearables', description: 'Smartwatches and fitness trackers', parentCategory: electronics._id }).save()

        // Subcategories for Laptops
        await new Category({ name: 'Gaming Laptops', description: 'High-performance laptops for gaming', parentCategory: laptops._id }).save()
        await new Category({ name: 'Ultrabooks', description: 'Lightweight and portable laptops', parentCategory: laptops._id }).save()

        // Subcategories for Gaming Consoles
        await new Category({ name: 'Sony Playstation', description: 'Playstation Consoles', parentCategory: gamingConsoles._id }).save()
        await new Category({ name: 'Xbox', description: 'Xbox Consoles', parentCategory: gamingConsoles._id }).save()

        // Subcategories for Clothing
        await new Category({ name: 'Men’s Clothing', description: 'Clothing for men', parentCategory: clothing._id }).save()
        await new Category({ name: 'Women’s Clothing', description: 'Clothing for women', parentCategory: clothing._id }).save()
        const kidsClothing = await new Category({ name: 'Kids’ Clothing', description: 'Clothing for kids', parentCategory: clothing._id }).save()

        // Subcategories for Kids’ Clothing
        await new Category({ name: 'Baby Clothes', description: 'Clothing for infants and toddlers', parentCategory: kidsClothing._id }).save()
        await new Category({ name: 'School Uniforms', description: 'Uniforms for kids of all ages', parentCategory: kidsClothing._id }).save()

        // Subcategories for Home Appliances
        await new Category({ name: 'Kitchen Appliances', description: 'Devices for your kitchen', parentCategory: homeAppliances._id }).save()
        await new Category({ name: 'Vacuum Cleaners', description: 'For cleaning and maintenance', parentCategory: homeAppliances._id }).save()
        await new Category({ name: 'Air Conditioners', description: 'Cooling and air circulation', parentCategory: homeAppliances._id }).save()

        // Subcategories for Books
        await new Category({ name: 'Fiction', description: 'Novels and stories', parentCategory: books._id }).save()
        await new Category({ name: 'Non-Fiction', description: 'Biographies, history, and more', parentCategory: books._id }).save()
        await new Category({ name: 'Children’s Books', description: 'Books for kids and teens', parentCategory: books._id }).save()

        // Subcategories for Toys
        await new Category({ name: 'Board Games', description: 'Fun games for family and friends', parentCategory: toys._id }).save()
        await new Category({ name: 'Action Figures', description: 'Figures from movies and shows', parentCategory: toys._id }).save()
        await new Category({ name: 'Educational Toys', description: 'Toys that teach and entertain', parentCategory: toys._id }).save()

        // Subcategories for Sports & Outdoors
        await new Category({ name: 'Fitness Equipment', description: 'Equipment for gyms and workouts', parentCategory: sports._id }).save()
        await new Category({ name: 'Outdoor Gear', description: 'Tents, backpacks, and more', parentCategory: sports._id }).save()
        await new Category({ name: 'Team Sports', description: 'Equipment for team sports like soccer', parentCategory: sports._id }).save()

        console.log('Categories seeded successfully.')
    } catch (error) {
        console.error('Error seeding categories:', error.message)
    } finally {
        mongoose.connection.close()
        console.log('Database connection closed.')
    }
}

const runSeeder = async () => {
    await connectDB()
    await seedCategories()
}

runSeeder()