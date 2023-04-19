import _ from "lodash";
import ReactionError from "@reactioncommerce/reaction-error";

/**
 * @name catalogItems
 * @method
 * @memberof Catalog/NoMeteorQueries
 * @summary query the Catalog by shop ID and/or tag ID
 * @param {Object} context - an object containing the per-request state
 * @param {Object} params - request parameters
 * @param {String[]} [params.searchQuery] - Optional text search query
 * @param {String[]} [params.shopIds] - Shop IDs to include (OR)
 * @param {String[]} [params.tags] - Tag IDs to include (OR)
 * @returns {Promise<MongoCursor>} - A MongoDB cursor for the proper query
 */
export default async function catalogItems(
  context,
  { searchQuery, shopIds, flag, tagIds, catalogBooleanFilters } = {}
) {
  const { collections } = context;
  const { Catalog } = collections;
  const today = new Date().toISOString().substring(0, 10);
  if ((!shopIds || shopIds.length === 0) && (!tagIds || tagIds.length === 0)) {
    throw new ReactionError(
      "invalid-param",
      "You must provide tagIds or shopIds or both"
    );
  }

  // if we send filter option from frontend
  if (flag) {
    console.log("queries without flag", catalogBooleanFilters);
    let query = {
      "product.isDeleted": { $ne: true },
      ...catalogBooleanFilters,
      "product.isVisible": true,
      "product.metafields.value": flag ? flag : "",
      "product.metafields": {
        $elemMatch: {
          key: "dueDate",
          value: { $gte: today },
        },
      },
      // $and: [
      //   { "product.metafields.key": "dueDate" },
      //   { "product.metafields.value": { $gte: { $toDate: today } } },
      // ],
    };

    if (shopIds) query.shopId = { $in: shopIds };
    if (tagIds) query["product.tagIds"] = { $in: tagIds };

    if (searchQuery) {
      query.$text = {
        $search: _.escapeRegExp(seapmrchQuery),
      };
    }
    console.log("filter query", query);
    // let result = await Catalog.find(query).toArray();
    // console.log("result ->>>>>>>", result);
    return Catalog.find(query);
  } else {
    // if we dont send any filter option
    console.log("queries without flag", catalogBooleanFilters);
    console.log("if flaq is not sent");
    let query = {
      "product.isDeleted": { $ne: true },
      ...catalogBooleanFilters,
      "product.isVisible": true,
      "product.metafields": {
        $elemMatch: {
          key: "dueDate",
          value: { $gte: today },
        },
      },
    };

    if (shopIds) query.shopId = { $in: shopIds };
    if (tagIds) query["product.tagIds"] = { $in: tagIds };

    if (searchQuery) {
      query.$text = {
        $search: _.escapeRegExp(seapmrchQuery),
      };
    }
    console.log("filter query", query);
    let result = await Catalog.find(query)
      .sort({ "product.upVotes": -1 })
      .toArray();
    console.log("result ->>>>>>>", result);
    return Catalog.find(query);
  }
}
