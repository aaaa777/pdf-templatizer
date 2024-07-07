export const json = {
    "name": "Scheme Sample",
    "description": "This is a sample scheme.",
    "inputs": [
        {
            "name": "タイトル",
            "description": "Title of the article",
            "placeholder": "世界のゴキブリ",
            "editable": false,
            "values": [
                {
                    "id": "title1",
                    "name": "title",
                    "description": "Article title",
                    "defaultValue": "世界のゴキブリ",
                    "position": { "unit": "pt", "x": 0, "y": 0, "fontSize": 20 }
                },
            ]
        },
        {
            "name": "説明文",
            "description": "Description of the guide",
            "editable": false,
            "values": [
                {
                    "id": "description1",
                    "name": "description",
                    "description": "Guide description",
                    "defaultValue": "世界のゴキブリの解説です",
                    "position": { "unit": "pt", "x": 0, "y": 0, "fontSize": 20 }
                },
            ]
        },
        {
            "name": "学生一覧",
            "description": "Students",
            "ediable": true,
            "values": [
                { "id": "students1", "name": "students", "description": "Student's name", "position": { "unit": "pt", "x": 0, "y": 0, "fontSize": 20 } },
                { "id": "students2", "name": "students", "description": "Student's name", "position": { "unit": "pt", "x": 0, "y": 0, "fontSize": 20 } },
                { "id": "students3", "name": "students", "description": "Student's name", "position": { "unit": "pt", "x": 0, "y": 0, "fontSize": 20 } },
            ]
        },        
    ]
};