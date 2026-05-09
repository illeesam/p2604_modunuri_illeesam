package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyhBatchHistMapper {

    /** 단건조회 */
    SyhBatchHistDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyhBatchHistDto.Item> selectList(SyhBatchHistDto.Request req);

    /** 페이징조회 */
    List<SyhBatchHistDto.Item> selectPageList(SyhBatchHistDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyhBatchHistDto.Request req);

    /** 수정 */
    int updateSelective(SyhBatchHist entity);
}
