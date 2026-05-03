package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhAccessLogMapper {

    List<SyhAccessLogDto> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);
}
