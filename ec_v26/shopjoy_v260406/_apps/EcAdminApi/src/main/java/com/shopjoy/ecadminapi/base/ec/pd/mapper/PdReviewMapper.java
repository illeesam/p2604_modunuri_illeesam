package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdReviewMapper {

    PdReviewDto.Item selectById(@Param("id") String id);

    List<PdReviewDto.Item> selectList(PdReviewDto.Request req);

    List<PdReviewDto.Item> selectPageList(PdReviewDto.Request req);

    long selectPageCount(PdReviewDto.Request req);

    int updateSelective(PdReview entity);

    /**
     * 상품별 평점 집계 — { total, avgRating, rate5, rate4, rate3, rate2, rate1 }
     * FO 상품상세 리뷰 요약(summary) 영역용
     */
    Map<String, Object> selectRatingSummary(@Param("prodId") String prodId);
}
