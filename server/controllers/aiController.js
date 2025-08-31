const { GoogleGenerativeAI } = require("@google/generative-ai");
const SalesRecord = require('../models/salesRecordModel');

// Initialize the AI with your key from the .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getAIInsights = async (req, res) => {
    try {
        // 1. Gather Data: Get total sales for each of the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const salesData = await SalesRecord.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalSales: { $sum: "$sales_amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Engineer the Prompt
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `You are a helpful and motivating executive sales coach for SIC Life LTD, a major insurance company in Ghana. 

Analyze the following daily total sales data for the entire company over the last 30 days. The currency is Ghanaian Cedis (GHS).

Sales Data: ${JSON.stringify(salesData, null, 2)}

Based ONLY on this data, provide:

1. **Positive Trend**: One clear positive trend you've observed in the sales performance.

2. **Area for Improvement**: One key area where the company could improve its sales performance.

3. **Actionable Suggestions**: Two concrete, actionable suggestions for the management to boost overall sales.

4. **Motivational Note**: A brief, encouraging message for the sales team.

Format your response in clear, professional paragraphs that are ready to be displayed in a dashboard card. Keep the tone positive and constructive. Focus on insights that can drive business growth.`;

        // 3. Make the API Call
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // 4. Send Response to Frontend
        res.json({ 
            insight: text,
            dataPoints: salesData.length,
            dateRange: {
                from: thirtyDaysAgo.toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error("AI Insight generation failed:", error);
        
        // Provide a fallback response if AI fails
        const fallbackInsight = `I'm currently unable to analyze the sales data, but here are some general best practices for insurance sales:

1. **Focus on Customer Relationships**: Build trust through personalized service and follow-up.
2. **Leverage Digital Tools**: Use technology to streamline processes and improve customer experience.
3. **Regular Training**: Invest in ongoing sales training and product knowledge updates.
4. **Performance Tracking**: Monitor key metrics and celebrate small wins to maintain motivation.

Please try again later for a data-driven analysis.`;
        
        res.json({ 
            insight: fallbackInsight,
            isFallback: true,
            error: error.message 
        });
    }
};

// Get AI insights for specific date ranges
const getAIInsightsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const salesData = await SalesRecord.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalSales: { $sum: "$sales_amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `You are a helpful and motivating executive sales coach for SIC Life LTD, a major insurance company in Ghana. 

Analyze the following sales data for the period from ${startDate} to ${endDate}. The currency is Ghanaian Cedis (GHS).

Sales Data: ${JSON.stringify(salesData, null, 2)}

Based ONLY on this data, provide:

1. **Performance Summary**: A brief overview of sales performance during this period.
2. **Key Insights**: Two specific insights about sales patterns or trends.
3. **Recommendations**: Two actionable recommendations for improving performance.
4. **Team Motivation**: A brief motivational message for the sales team.

Format your response in clear, professional paragraphs suitable for a dashboard display.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ 
            insight: text,
            dataPoints: salesData.length,
            dateRange: { startDate, endDate }
        });

    } catch (error) {
        console.error("AI Insight generation by date range failed:", error);
        res.status(500).json({ message: "Failed to generate AI insight for the specified date range." });
    }
};

module.exports = { 
    getAIInsights,
    getAIInsightsByDateRange
};
