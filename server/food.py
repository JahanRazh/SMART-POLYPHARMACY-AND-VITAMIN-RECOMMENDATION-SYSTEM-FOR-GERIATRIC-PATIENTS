import pandas as pd

# Read the CSV file (assume the file is named 'food.csv')
df = pd.read_csv('MealPlan/food.csv')

# Define classification functions

def is_vegetarian(row):
    non_veg_keywords = ['meat', 'fish', 'breakfast meat', 'fish fillet']
    for kw in non_veg_keywords:
        if kw in row['Category'].lower() or kw in row['Description'].lower():
            return 'No'
    return 'Yes'

def is_vegan(row):
    non_vegan_keywords = ['milk', 'yogurt', 'cheese', 'buttermilk', 'kefir', "goat's milk", 'frozen yogurt']
    if row['Data.Cholesterol'] > 0 or row['Data.Vitamins.Vitamin B12'] > 0:
        return 'No'
    for kw in non_vegan_keywords:
        if kw in row['Description'].lower() or kw in row['Category'].lower():
            return 'No'
    return 'Yes'

def is_gluten_free(row):
    gluten_keywords = ['wheat', 'bread', 'bun', 'breading', 'batter']
    for kw in gluten_keywords:
        if kw in row['Category'].lower() or kw in row['Description'].lower():
            return 'No'
    return 'Yes'

def is_dairy_free(row):
    dairy_keywords = ['milk', 'yogurt', 'cheese', 'buttermilk', 'kefir', "goat's milk", 'frozen yogurt']
    for kw in dairy_keywords:
        if kw in row['Description'].lower() or kw in row['Category'].lower():
            return 'No'
    return 'Yes'

def is_nut_allergy_safe(row):
    nut_keywords = ['almond', 'nut', 'coconut']
    for kw in nut_keywords:
        if kw in row['Description'].lower() or kw in row['Category'].lower():
            return 'No'  # Not safe
    return 'Yes'  # Safe

def get_spice_level(row):
    high_spice_keywords = ['chipotle', 'dill', 'ranch', 'spinach dip', 'tzatziki', 'vegetable dip']
    medium_spice_keywords = ['onion dip']
    for kw in high_spice_keywords:
        if kw in row['Description'].lower():
            return 'High'
    for kw in medium_spice_keywords:
        if kw in row['Description'].lower():
            return 'Medium'
    return 'Low'

# Add new columns
df['Vegetarian'] = df.apply(is_vegetarian, axis=1)
df['Vegan'] = df.apply(is_vegan, axis=1)
df['Gluten Free'] = df.apply(is_gluten_free, axis=1)
df['Dairy Free'] = df.apply(is_dairy_free, axis=1)
df['Nut Allergy Safe'] = df.apply(is_nut_allergy_safe, axis=1)
df['Spice Level'] = df.apply(get_spice_level, axis=1)

# Save the modified dataframe to a new CSV file
df.to_csv('classified_food.csv', index=False)

# Print the first few rows to verify
print(df.head())