package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample2Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample2Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample2Service {

    private final ZzSample2Mapper zzSample2Mapper;
    private final ZzSample2Repository zzSample2Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 */
    public ZzSample2Dto.Item getById(String id) {
        ZzSample2Dto.Item dto = zzSample2Mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** findById — 엔티티 조회 */
    public ZzSample2 findById(String id) {
        return zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample2Repository.existsById(id);
    }

    /** getList — 조회 */
    public List<ZzSample2Dto.Item> getList(ZzSample2Dto.Request req) {
        if (req.getPageSize() != null) PageHelper.addPaging(req);
        return zzSample2Mapper.selectList(VoUtil.voToMap(req));
    }

    /** getPageData — 조회 */
    public ZzSample2Dto.PageResponse getPageData(ZzSample2Dto.Request req) {
        PageHelper.addPaging(req);
        ZzSample2Dto.PageResponse res = new ZzSample2Dto.PageResponse();
        List<ZzSample2Dto.Item> list = zzSample2Mapper.selectPageList(VoUtil.voToMap(req));
        long count = zzSample2Mapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample2 create(ZzSample2 body) {
        body.setSample2Id(CmUtil.generateId("zz_sample2"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        ZzSample2 saved = zzSample2Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample2 save(ZzSample2 entity) {
        if (entity.getSample2Id() == null || !zzSample2Repository.existsById(entity.getSample2Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample2Id());
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSample2Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample2 update(String id, ZzSample2 body) {
        ZzSample2 entity = zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "sample2Id^rgtr^regDt");
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        ZzSample2 saved = zzSample2Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample2 entity) {
        return zzSample2Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample2 entity = zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        zzSample2Repository.delete(entity);
        em.flush();
        if (zzSample2Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample2> rows) {
        zzSample2Repository.saveAll(rows);
    }
}
