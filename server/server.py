from flask import Flask,jsonify  # type: ignore

app = Flask(__name__)

#/recommend
@app.route("/recommend", methods=['GET'])
def return_home():
    return jsonify({
        'message': "SMART Polypharmacy and Vitamin Recommendation System API"
    })

if __name__ == '__main__':
    app.run(debug=True)