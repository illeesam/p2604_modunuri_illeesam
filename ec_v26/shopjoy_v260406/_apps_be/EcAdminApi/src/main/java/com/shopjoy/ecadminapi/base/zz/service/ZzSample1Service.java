package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample1Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample2Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample3Repository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample1Service {

    private final ZzSample1Repository zzSample1Repository;
    private final ZzSample2Repository zzSample2Repository;
    private final ZzSample3Repository zzSample3Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 (하위 sample2s / sample3s 포함, sample1_id 기준) */
    public ZzSample1Dto.Item getById(String id) {
        ZzSample1Dto.Item dto = zzSample1Repository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample1Dto.Item getByIdOrNull(String id) {
        return zzSample1Repository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzSample1 findById(String id) {
        return zzSample1Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample1 findByIdOrNull(String id) {
        return zzSample1Repository.findById(id).orElse(null);
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample1Repository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!zzSample1Repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 조회 (각 항목에 하위 sample2s / sample3s 포함) */
    public List<ZzSample1Dto.Item> getList(ZzSample1Dto.Request req) {
        List<ZzSample1Dto.Item> list = zzSample1Repository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 sample2s / sample3s 포함) */
    public ZzSample1Dto.PageResponse getPageData(ZzSample1Dto.Request req) {
        PageHelper.addPaging(req);
        ZzSample1Dto.PageResponse res = zzSample1Repository.selectPageList(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (하위 sample2s / sample3s 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 sample2 1회 + sample3 1회만 조회한다.
     */
    private void _listFillRelations(List<ZzSample1Dto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> sample1Ids = list.stream()
            .map(ZzSample1Dto.Item::getSample1Id)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (sample1Ids.isEmpty()) return;

        // 하위 sample2 일괄조회 → Map<sample1Id, List<sample2>>
        ZzSample2Dto.Request req2 = new ZzSample2Dto.Request();
        req2.setSample1Ids(sample1Ids);
        Map<String, List<ZzSample2Dto.Item>> sample2Map = zzSample2Repository.selectList(req2).stream()
            .collect(Collectors.groupingBy(ZzSample2Dto.Item::getSample1Id));

        // 하위 sample3 일괄조회 → Map<sample1Id, List<sample3>>
        ZzSample3Dto.Request req3 = new ZzSample3Dto.Request();
        req3.setSample1Ids(sample1Ids);
        Map<String, List<ZzSample3Dto.Item>> sample3Map = zzSample3Repository.selectList(req3).stream()
            .collect(Collectors.groupingBy(ZzSample3Dto.Item::getSample1Id));

        // 각 항목에 분배
        for (ZzSample1Dto.Item item : list) {
            item.setSample2s(sample2Map.getOrDefault(item.getSample1Id(), List.of()));
            item.setSample3s(sample3Map.getOrDefault(item.getSample1Id(), List.of()));
        }
    }

    /** 하위 계층(sample2s/sample3s) 채우기 */
    private void _itemFillRelations(ZzSample1Dto.Item item) {
        ZzSample2Dto.Request req2 = new ZzSample2Dto.Request();
        req2.setSample1Id(item.getSample1Id());
        item.setSample2s(zzSample2Repository.selectList(req2));

        ZzSample3Dto.Request req3 = new ZzSample3Dto.Request();
        req3.setSample1Id(item.getSample1Id());
        item.setSample3s(zzSample3Repository.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzSample1 create(ZzSample1 body) {
        body.setSample1Id(CmUtil.generateId("zz_sample1"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzSample1 saved = zzSample1Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample1 save(ZzSample1 entity) {
        if (entity.getSample1Id() == null || !zzSample1Repository.existsById(entity.getSample1Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample1Id() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzSample1Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample1 update(String id, ZzSample1 body) {
        ZzSample1 entity = zzSample1Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "sample1Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzSample1 saved = zzSample1Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample1 entity) {
        return zzSample1Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample1 entity = zzSample1Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        zzSample1Repository.delete(entity);
        em.flush();
        if (zzSample1Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample1> rows) {
        zzSample1Repository.saveAll(rows);
    }
}
