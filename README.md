<h2 align="center">@cytex/elastictype</h3>
<p align="center">
    A <strong>Object Document Mapping (ODM)</strong> manager for <strong>Elasticsearch</strong> written in <strong>TypeScript</strong>.
</p>

<br/>

<div align="center">

[![Node.js CI](https://github.com/cytex-media-solutions/elastictype/actions/workflows/node.js.yml/badge.svg)](https://github.com/cytex-media-solutions/elastictype/actions/workflows/node.js.yml)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()
![GitHub issues](https://img.shields.io/github/issues/cytex-media-solutions/elastictype)
![GitHub pull requests](https://img.shields.io/github/issues-pr/cytex-media-solutions/elastictype)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![codecov](https://codecov.io/gh/cytex-media-solutions/elastictype/graph/badge.svg?token=P7TXWCFFB5)](https://codecov.io/gh/cytex-media-solutions/elastictype)

</div>

<br/>

<div align="center" style="margin-bottom: 20px; background-color: #FFF; border-radius: 5px; padding: 20px; color: #000;">
        ⚠️ This project is still in development and not ready for production use. ⚠️<br/>
        Can't wait to use it? Feel free to 
        <a href="#authors">contribute</a>.
</div>

<br/>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installing](#installing)
- [Tests](#tests)
- [Usage](#usage)
- [Built Using](#built_using)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🧐 About

<a name="about"></a>

Elastictype is a easy way to model application data stored in Elasticsearch. It is inpsired by mongoose and @nestjs/mongoose and thus includes type casting, validation, query building, hooks and much more. It is written in TypeScript and thus provides type safety.

## 🏁 Features

<a name="features"></a>

- Type casting
- Validation
- Query building
- Hooks
- Type safety
- Intuitive index declaration via Decorators

## 🏁 Getting Started

<a name="getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

<a name="prerequisites"></a>

Please make sure you have installed the following tools:

- [Node.js](https://nodejs.org/en/) - JavaScript runtime environment
- [Elasticsearch](https://www.elastic.co/de/downloads/elasticsearch) - Search engine

### Installing

<a name="installing"></a>

Install the package via npm:

```bash
npm install @cytex/elastictype --save
```

or via yarn:

```bash
yarn add @cytex/elastictype
```

## 🎈 Usage

<a name="usage"></a>

### Basic usage

```typescript
import {
  BaseSchema,
  ElasticField,
  ElasticDataType,
  Index,
  Model,
} from "@cytex/elastictype";

@Index({
  name: "cats", // Name of the index
})
export class Cat extends BaseSchema<Cat> {
  @Prop(ElasticDataType.Keyword)
  public name: string;

  @ElasticField({
    // Type of the field (used for explicit mapping declaration)
    type: ElasticDataType.Integer,
  })
  public age: number;
}

// Create the index and the mapping in Elasticsearch
Cat.syncMapping();

// Create a new cat
const cat = new Cat();
cat.name = "Garfield";
cat.age = 42;

// Save the cat to Elasticsearch
await cat.save();

// Update the cat
await cat.update({ age: 43 });

// Delete the cat
await cat.delete();

// Find all cats
const cats = await Cat.find({ age: 43 });

// Find a cat by id
const cat = await Cat.findById("foo");
```

## 🔧 Running the tests

<a name="tests"></a>

Tests are written with jest. You can run them with the following command:

```bash
npm run test
```

## ⛏️ Built Using

<a name="built_using"></a>

- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [Jest](https://jestjs.io/) - Testing framework
- [Elasticsearch JS](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html) - Elasticsearch client for Node.js
- [Nestjs](https://nestjs.com/) - Node.js framework

## ✍️ Authors

<a name="authors"></a>

- [@cytex-media-solutions](https://github.com/cytex-media-solutions) - Project author
- [@sjutz](https://github.com/sjutz) - Project maintainer <simon.jutz@cytex.ch>

## 🎉 Acknowledgements

<a name="acknowledgement"></a>

- [Nestjs](https://nestjs.com/) - Node.js framework
- [mongoose](https://mongoosejs.com/) - MongoDB object modeling for Node.js
- [@nestjs/mongoose](https://github.com/nestjs/mongoose) - Mongoose module for Nest framework (not used in this project but inspired by it)
