package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdImgMapper {

    PdProdImgDto.Item selectById(@Param("id") String id);

    List<PdProdImgDto.Item> selectList(PdProdImgDto.Request req);

    List<PdProdImgDto.Item> selectPageList(PdProdImgDto.Request req);

    long selectPageCount(PdProdImgDto.Request req);

    int updateSelective(PdProdImg entity);
}
